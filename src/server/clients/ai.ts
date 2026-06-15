import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, embed } from "ai";
import type { EmbeddingModel, LanguageModel } from "ai";
import { env } from "~/env";
import { db } from "./db";
import { createComposioClient } from "./composio";

// Chat / agent calls run on a cloud LLM (free, no credit card required):
// OpenAI gpt-4o-mini if a key is set, else NVIDIA NIM (128k context), else Groq.
// Embeddings run on Google Gemini, since Groq has no embedding models.
// This replaces the Vercel AI Gateway path, which requires a card on file.

// All available Groq keys. Extra keys extend the daily free-tier quota: when one
// key returns 429 (rate limit), the request is retried with the next key.
const groqKeys = [
  env.GROQ_API_KEY,
  env.GROQ_API_KEY_2,
  env.GROQ_API_KEY_3,
].filter((k): k is string => Boolean(k));

let groqKeyIndex = 0;

// Custom fetch that rotates Groq keys on 429. The AI SDK sends a string body, so
// it can be safely replayed across attempts. On success we stick with the key
// that worked; if all keys are rate-limited we return the last 429 response.
const rotatingGroqFetch: typeof fetch = async (input, init) => {
  let lastResponse: Response | undefined;
  for (let i = 0; i < groqKeys.length; i++) {
    const idx = (groqKeyIndex + i) % groqKeys.length;
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${groqKeys[idx]}`);
    const res = await fetch(input, { ...init, headers });
    if (res.status !== 429) {
      groqKeyIndex = idx;
      return res;
    }
    lastResponse = res;
  }
  return lastResponse ?? fetch(input, init);
};

const groq = createGroq({
  apiKey: groqKeys[0] ?? env.GROQ_API_KEY,
  fetch: rotatingGroqFetch,
});
const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// OpenAI (optional). When a key is set, Cloud chat uses gpt-4o-mini: cheap,
// high rate limits, reliable tool-calling, 128k context - no free-tier TPM wall.
const openai = env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = "gpt-4o-mini";

// NIM's llama-3.3-70b only supports ONE tool call per turn. The AI SDK doesn't
// set parallel_tool_calls, so NIM defaults to parallel and 400s when the model
// emits multiple. This fetch forces parallel_tool_calls:false on tool requests.
const nimFetch: typeof fetch = async (input, init) => {
  if (init?.body && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body) as Record<string, unknown>;
      if (Array.isArray(body.tools) && body.tools.length > 0) {
        body.parallel_tool_calls = false;
        init = { ...init, body: JSON.stringify(body) };
      }
    } catch {
      // non-JSON body - send unchanged
    }
  }
  return fetch(input, init);
};

// NVIDIA NIM (optional, free, no card). OpenAI-compatible endpoint serving
// llama-3.3-70b at full 128k context - no Groq 12k TPM wall, so all tools fit.
const nvidia = env.NVIDIA_API_KEY
  ? createOpenAICompatible({
      name: "nvidia",
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: env.NVIDIA_API_KEY,
      fetch: nimFetch,
    })
  : null;
// Agentic model on NIM. gpt-oss-120b is the strongest available tool-caller:
// it honors parallel_tool_calls:false (one tool per turn → no NIM "single
// tool-calls" 400), handles multi-step tasks well, and replies cleanly.
// History: kimi-k2.6 retired/dead on NVIDIA; llama-3.3-70b ignored the parallel
// flag and 400'd on multi-action requests. Alternative: "meta/llama-3.3-70b-instruct".
const NVIDIA_MODEL = "openai/gpt-oss-120b";

// Tool-calling capable Groq model. Change here to swap chat models globally.
// llama-3.3-70b-versatile: 12k TPM (fits the agent's ~9k request) and the only
// Groq free model that both fits AND does tools. gpt-oss-120b formats tools more
// cleanly but only has 8k TPM (too small). Occasional malformed tool calls here
// are a known small-model quirk - retry, or move to Cerebras for higher limits.
const CHAT_MODEL = "llama-3.3-70b-versatile";

// Gemini embedding model. outputDimensionality is set to 1024 to match the
// VECTOR(1024) column in the Prisma schema (composio_claw_memory.embedding).
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1024;

/**
 * Resolve the cloud chat/agent language model.
 * Preference order: OpenAI gpt-4o-mini > NVIDIA NIM (free, 128k) > Groq.
 * The optional argument is accepted for call-site compatibility but ignored —
 * model selection is environment-driven, not per-instance.
 */
export function chatModel(_storedModel?: string): LanguageModel {
  if (openai) {
    return openai(OPENAI_MODEL);
  }
  if (nvidia) {
    return nvidia(NVIDIA_MODEL);
  }
  return groq(CHAT_MODEL);
}

/** Gemini text embedding model for memory vectors. */
export function embeddingModel(): EmbeddingModel {
  return google.textEmbeddingModel(EMBEDDING_MODEL);
}

/** Provider options that pin the embedding output to 1024 dimensions. */
export const embeddingProviderOptions = {
  google: { outputDimensionality: EMBEDDING_DIMENSIONS },
} as const;

/* ---- Intelligence-engine client surface (used by src/founderops/engine) ---- */

// Raw text LLM call (NIM via chatModel). Used by the extractor + brief/weekly prompts.
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<string> {
  try {
    const { text } = await generateText({
      model: chatModel(),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: options?.temperature ?? 0.1,
      maxOutputTokens: options?.maxTokens ?? 4096,
    });
    return text;
  } catch (error) {
    console.error("[callLLM] failed:", error);
    return "[]"; // safe fallback for JSON-expecting callers
  }
}

// Embedding for the record linker.
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: embeddingModel(),
      value: text,
      providerOptions: embeddingProviderOptions,
    });
    return embedding;
  } catch {
    return [];
  }
}

// Execute a Composio tool for a specific instance's connected account.
// The ingestion adapters call this to pull real activity (Gmail/Slack/etc.).
// Returns {} on ANY failure (toolkit not connected, auth missing, network error)
// so a single unconnected source degrades to a no-op instead of crashing the
// whole ingestion cycle.
export async function callTool(
  instanceId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  try {
    const inst = await db.composioClawInstance.findUnique({
      where: { id: instanceId },
      select: { userId: true },
    });
    if (!inst) return {};

    const composio = createComposioClient();
    const tools = await composio.tools.get(inst.userId, { tools: [toolName] });
    const tool = tools[toolName];
    if (!tool?.execute) return {}; // toolkit not connected for this user

    return await tool.execute(args, {
      toolCallId: `ingest-${toolName}`,
      messages: [],
    });
  } catch (error) {
    console.error(`[callTool] ${toolName} failed:`, error);
    return {};
  }
}
