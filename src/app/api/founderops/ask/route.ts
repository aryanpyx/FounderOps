import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { prepareAgentRun } from "~/server/api/routers/trustclaw/agent/setup";
import { stripToolResultEchoes } from "~/server/api/routers/trustclaw/agent/strip-tool-echoes";
import { extractMemories } from "~/founderops/lib/extract";

// Non-streaming agent run for the FounderOps "Ask" page. Runs the real NIM agent
// (with Composio tools + pgvector memory) and returns the final answer text.
export const maxDuration = 60;

const askBody = z.object({ query: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const instance = await db.composioClawInstance.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instance) {
    return new Response(JSON.stringify({ error: "no_instance" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = askBody.safeParse(await request.json());
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "invalid_body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const prepareResult = await prepareAgentRun({
      instanceId: instance.id,
      userMessage: parsed.data.query,
      source: "web",
    });
    const { agent, messages } = prepareResult.result;
    const result = await agent.generate({
      prompt: messages,
      abortSignal: request.signal,
    });
    const answer = stripToolResultEchoes(result.text).trim();

    // Surface the tool calls the agent made so the UI can show a "Tool Execution"
    // panel (like TrustClaw's chat) - real provenance of how the answer was built.
    const toolCalls = result.steps.flatMap((step) =>
      step.toolCalls.map((tc, i) => ({
        name: tc.toolName,
        args: tc.input as unknown,
        result: (step.toolResults[i]?.output ?? null) as unknown,
      })),
    );

    // Capture any decision/commitment/blocker/metric the founder stated into
    // typed memory. Non-fatal - a failure here never breaks the answer.
    const captured = await extractMemories(
      instance.id,
      `Founder said: ${parsed.data.query}\n\nAssistant replied: ${answer}`,
      "chat",
      session.user.name ?? "Founder",
    ).catch(() => ({ inserted: 0, found: 0 }));

    return new Response(
      JSON.stringify({ answer, toolCalls, captured: captured.inserted }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "agent run failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
