import { ToolLoopAgent, stepCountIs } from "ai";
import { chatModel } from "~/server/clients/ai";
import { env } from "~/env";
import type { ToolSet, SystemModelMessage } from "ai";
import { db } from "~/server/clients/db";
import { createComposioClient } from "~/server/clients/composio";
import { buildSystemPrompt } from "./system-prompt";
import {
  createCustomTools,
  searchMemoriesForContext,
} from "./tools";
import { getContextWindow } from "./context/context-window";
import { pruneContext } from "./context/context-pruning";
import {
  loadContextMessages,
  buildContext,
  toPlainRecordSafe,
  toPrismaJson,
  runPostResponseTasks,
  sanitizeString,
  deepSanitize,
} from "./context/build-context";
import {
  DEFAULT_COMPACTION_SETTINGS,
  type CompactionSettings,
} from "./context/token-estimation";
import { stripToolResultEchoes } from "./strip-tool-echoes";
import { clearStreamingMessage } from "~/server/clients/redis";
import type { ReconstructedMessage } from "./types";

type MessageSource = "web" | "telegram" | "cron";

/**
 * Wraps every tool's execute function to sanitize its return value,
 * replacing lone Unicode surrogates with U+FFFD. Composio tool results
 * (e.g. scraped web pages, email bodies) can contain malformed Unicode
 * that produces invalid JSON when the AI SDK serializes the request
 * body for the Anthropic API.
 */
// Cap a single tool result at ~10k tokens. The tool loop feeds results straight
// back to the model and bypasses TrustClaw's between-turn context pruning, so a
// huge result (e.g. full HTML email bodies from GMAIL_FETCH_EMAILS) can overflow
// the model's context window. Oversized results are truncated to a preview.
const MAX_TOOL_RESULT_CHARS = 40_000;

// Force compact inputs on tools that otherwise return huge payloads. Gmail's
// include_payload pulls the full MIME tree (base64 bodies + attachments) and can
// be 100x larger than the metadata + snippet actually needed to summarize email.
const TOOL_INPUT_OVERRIDES: Record<string, Record<string, unknown>> = {
  GMAIL_FETCH_EMAILS: { include_payload: false },
};

function coerceToolInputs(tools: ToolSet): ToolSet {
  const wrapped: ToolSet = {};
  for (const [name, tool] of Object.entries(tools)) {
    const overrides = TOOL_INPUT_OVERRIDES[name.toUpperCase()];
    if (overrides && tool.execute) {
      const originalExecute = tool.execute;
      wrapped[name] = {
        ...tool,
        execute: async (...args: Parameters<typeof originalExecute>) => {
          const [input, ...rest] = args;
          const coerced =
            input && typeof input === "object"
              ? { ...input, ...overrides }
              : input;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return originalExecute(coerced as typeof input, ...rest);
        },
      };
    } else {
      wrapped[name] = tool;
    }
  }
  return wrapped;
}

function sanitizeToolResults(tools: ToolSet): ToolSet {
  const wrapped: ToolSet = {};
  for (const [name, tool] of Object.entries(tools)) {
    if (tool.execute) {
      const originalExecute = tool.execute;
      wrapped[name] = {
        ...tool,
        execute: async (...args: Parameters<typeof originalExecute>) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- tool execute returns unknown/any; deepSanitize preserves the shape
          const result = await originalExecute(...args);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const sanitized = deepSanitize(result);
          try {
            const json = JSON.stringify(sanitized);
            if (json.length > MAX_TOOL_RESULT_CHARS) {
              return {
                truncated: true,
                note: `Tool result was ${json.length} characters and was truncated to the first ${MAX_TOOL_RESULT_CHARS} to fit the model context. If you need more, narrow the request (e.g. fewer items / shorter range).`,
                preview: json.slice(0, MAX_TOOL_RESULT_CHARS),
              };
            }
          } catch {
            // non-serializable result - return as-is
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return sanitized;
        },
      };
    } else {
      wrapped[name] = tool;
    }
  }
  return wrapped;
}

interface PrepareAgentRunParams {
  instanceId: string;
  userMessage: string;
  source: MessageSource;
  userMessageType?: "hidden";
}

interface PrepareAgentRunResult {
  agent: ToolLoopAgent;
  messages: ReconstructedMessage[];
}

type PrepareResult = { status: "ready"; result: PrepareAgentRunResult };

export async function prepareAgentRun(
  params: PrepareAgentRunParams,
): Promise<PrepareResult> {
  const { instanceId, userMessage, source, userMessageType } = params;

  const instance = await db.composioClawInstance.findUnique({
    where: { id: instanceId },
  });

  if (!instance) {
    throw new Error("Instance not found");
  }

  const user = await db.user.findUnique({
    where: { id: instance.userId },
    select: { timezone: true },
  });

  const userTimezone = user?.timezone ?? "UTC";

  const relevantMemories = await searchMemoriesForContext(instanceId, userMessage);

  const systemPrompt = sanitizeString(
    buildSystemPrompt({
      soulPrompt: instance.soulPrompt,
      identityPrompt: instance.identityPrompt,
      userPrompt: instance.userPrompt,
      relevantMemories,
      hasCompactionSummary: !!instance.lastCompactionSummary,
      userTimezone,
    }),
  );

  const dbMessages = await loadContextMessages(
    instanceId,
    instance.lastCompactionAt,
  );
  const aiMessages = buildContext(
    dbMessages,
    instance.lastCompactionSummary,
    userMessage,
  );

  const contextWindow = getContextWindow(instance.anthropicModel);
  const { messages: prunedMessages } = pruneContext(aiMessages, contextWindow);

  // Add cache breakpoint to last history message (before new user message)
  // so the conversation prefix is cached across turns
  if (prunedMessages.length >= 2) {
    const lastHistoryIndex = prunedMessages.length - 2;
    const msg = prunedMessages[lastHistoryIndex]!;
    prunedMessages[lastHistoryIndex] = {
      ...msg,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    };
  }

  await db.message.create({
    data: {
      instanceId,
      role: "user",
      content: [{ type: "text", text: userMessage }],
      source,
      ...(userMessageType && { messageType: userMessageType }),
    },
  });

  const composio = createComposioClient();

  // Load direct toolkit tools (one-step calls) instead of Composio's tool-router
  // search meta-tools - small free-tier models can't reliably drive the router's
  // search-then-execute dance. `important` + `limit` keep the toolset small and
  // focused, which also fits free-tier model TPM limits. Toolkits come from
  // env.COMPOSIO_TOOLKITS (e.g. "GMAIL,GOOGLECALENDAR").
  const toolkitSlugs = (env.COMPOSIO_TOOLKITS ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  // Pinned essential tools per toolkit. Composio's `important` flag returns tools
  // alphabetically, so e.g. calendar ACL-permission tools (GOOGLECALENDAR_ACL_*)
  // crowd out CREATE_EVENT/FIND_EVENT. We curate the demo-relevant tools explicitly
  // so the model always has the right one. Uncurated toolkits fall back to important.
  // 2 tools max per toolkit: Composio schemas are ~1.5k tokens each, and Groq's
  // free 12k TPM only fits ~4 tools total. Keep COMPOSIO_TOOLKITS to <=2 toolkits.
  const CURATED_TOOLS: Record<string, string[]> = {
    gmail: ["GMAIL_FETCH_EMAILS", "GMAIL_SEND_EMAIL"],
    googlecalendar: ["GOOGLECALENDAR_FIND_EVENT", "GOOGLECALENDAR_CREATE_EVENT"],
    googletasks: ["GOOGLETASKS_LIST_TASKS", "GOOGLETASKS_INSERT_TASK"],
  };

  const pinnedSlugs = toolkitSlugs.flatMap((tk) => CURATED_TOOLS[tk] ?? []);
  const uncuratedToolkits = toolkitSlugs.filter((tk) => !CURATED_TOOLS[tk]);

  const toolSets: ToolSet[] = [];
  if (pinnedSlugs.length > 0) {
    toolSets.push(
      await composio.tools.get(instance.userId, { tools: pinnedSlugs }),
    );
  }
  for (const tk of uncuratedToolkits) {
    toolSets.push(
      await composio.tools.get(instance.userId, {
        toolkits: [tk],
        important: true,
        limit: 4,
      }),
    );
  }
  const composioTools: ToolSet = Object.assign({}, ...toolSets);

  const customTools = createCustomTools(instanceId, userTimezone);

  const allTools: ToolSet = sanitizeToolResults(
    coerceToolInputs({
      ...composioTools,
      ...customTools,
    }),
  );

  // Pre-create assistant message row so we can update it in onFinish
  const assistantMessageRow = await db.message.create({
    data: {
      instanceId,
      role: "assistant",
      content: toPrismaJson([]),
      source,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
  });

  const model = chatModel(instance.anthropicModel);

  const agent = new ToolLoopAgent({
    model,
    instructions: {
      role: "system",
      content: systemPrompt,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    } satisfies SystemModelMessage,
    tools: allTools,
    stopWhen: stepCountIs(100),
    onFinish: async (result) => {
      try {
        const { totalUsage, steps } = result;
        const inputTokens = totalUsage.inputTokens ?? 0;
        const outputTokens = totalUsage.outputTokens ?? 0;
        const cacheReadTokens =
          totalUsage.inputTokenDetails?.cacheReadTokens ?? 0;
        const cacheWriteTokens =
          totalUsage.inputTokenDetails?.cacheWriteTokens ?? 0;

        // Build assistant content from steps (UIMessage parts format)
        const assistantParts: Array<Record<string, unknown>> = [];

        for (const step of steps) {
          for (let i = 0; i < step.toolCalls.length; i++) {
            const tc = step.toolCalls[i]!;
            const tr = step.toolResults[i];
            const tcInput = toPlainRecordSafe(tc.input);
            const tcResult = tr ? toPlainRecordSafe(tr.output) : null;

            assistantParts.push({
              type: "dynamic-tool" as const,
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              state: tcResult ? "output-available" : "input-available",
              input: tcInput,
              output: tcResult ?? {},
            });
          }

          const stepText = stripToolResultEchoes(step.text);
          if (stepText) {
            assistantParts.push({ type: "text" as const, text: stepText });
          }
        }

        // Update the pre-created assistant message with final content + totals
        await db.message.update({
          where: { id: assistantMessageRow.id },
          data: {
            content: toPrismaJson(assistantParts),
            inputTokens,
            outputTokens,
            cacheReadTokens,
            cacheWriteTokens,
          },
        });

        // Fire-and-forget post-response tasks
        const totalContextTokens = inputTokens + outputTokens;
        const settings: CompactionSettings = {
          contextWindow,
          ...DEFAULT_COMPACTION_SETTINGS,
        };

        void runPostResponseTasks({
          instanceId,
          instance: {
            anthropicModel: instance.anthropicModel,
            compactionCount: instance.compactionCount,
            memoryFlushCount: instance.memoryFlushCount,
            lastCompactionSummary: instance.lastCompactionSummary,
            lastCompactionAt: instance.lastCompactionAt,
          },
          contextTokens: totalContextTokens,
          settings,
          prunedMessages,
        });
      } catch (error) {
        console.error("[agent/onFinish] post-stream processing failed:", error);
      } finally {
        await clearStreamingMessage(instanceId).catch((error) =>
          console.error(
            "[agent/onFinish] clearStreamingMessage failed:",
            error,
          ),
        );
      }
    },
  });

  return {
    status: "ready",
    result: {
      agent,
      messages: prunedMessages,
    },
  };
}

export type {
  PrepareAgentRunParams,
  PrepareResult,
  PrepareAgentRunResult,
  MessageSource,
};
