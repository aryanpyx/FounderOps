import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { prepareAgentRun } from "~/server/api/routers/trustclaw/agent/setup";
import { stripToolResultEchoes } from "~/server/api/routers/trustclaw/agent/strip-tool-echoes";
import { extractMemories } from "~/founderops/lib/extract";
import { linkRecords } from "~/founderops/engine/linker";
import { toMemoryItem } from "~/founderops/lib/memory-mapper";

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

    // Capture typed memory ONLY when the turn was a statement of record, not an
    // action. If the agent executed tools (send email, create calendar event,
    // etc.), the founder asked it to *do* something — storing that command as a
    // Decision/Commitment is noise. Record-keeping turns ("we decided…", "I'll
    // ship Friday", "MRR went 1.2k→1.5k") run no tools, so we only extract then.
    const captured =
      toolCalls.length > 0
        ? { inserted: 0, found: 0 }
        : await extractMemories(
            instance.id,
            `Founder said: ${parsed.data.query}\n\nAssistant replied: ${answer}`,
            "chat",
            session.user.name ?? "Founder",
          ).catch(() => ({ inserted: 0, found: 0 }));

    // Newly captured memory → link it into the graph (best-effort, non-fatal).
    if (captured.inserted > 0) {
      await linkRecords(instance.id).catch(() => 0);
    }

    // Citations: surface the typed-memory records most relevant to the question
    // so the answer is grounded in real provenance, not just the model's words.
    const sources = await findRelevantMemories(instance.id, parsed.data.query).catch(
      () => [],
    );

    return new Response(
      JSON.stringify({ answer, toolCalls, captured: captured.inserted, sources }),
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

// Lightweight keyword relevance over the founder's typed memory. Returns the top
// matching records (as MemoryItems) to cite alongside the synthesized answer.
async function findRelevantMemories(instanceId: string, query: string) {
  const qWords = new Set(
    query
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 3),
  );
  if (qWords.size === 0) return [];

  const rows = await db.founderMemory.findMany({
    where: { instanceId },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return rows
    .map((r) => {
      const text = `${r.title} ${r.content}`.toLowerCase();
      let score = 0;
      for (const w of qWords) if (text.includes(w)) score++;
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => toMemoryItem(x.r));
}
