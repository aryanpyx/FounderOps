import { generateText } from "ai";
import { auth } from "~/server/auth";
import { db, Prisma } from "~/server/clients/db";
import { createComposioClient } from "~/server/clients/composio";
import { chatModel } from "~/server/clients/ai";

export const maxDuration = 60;

// One extracted record from the LLM pass.
interface Extracted {
  type: "Decision" | "Commitment" | "Blocker" | "Metric";
  title: string;
  content: string;
  author?: string;
  occurredAt?: string;
  messageId?: string;
  linkToSource?: string;
  details?: Record<string, unknown>;
}

const EXTRACTION_PROMPT = `You are FounderOps' memory extraction engine. From the founder's recent emails below, extract durable, decision-grade memory items. Ignore newsletters, receipts, and pure noise.

Return ONLY a JSON array (no prose, no markdown fences). Each item:
{
  "type": "Decision" | "Commitment" | "Blocker" | "Metric",
  "title": short label,
  "content": one or two sentence summary,
  "author": who it's from (email sender name/address),
  "occurredAt": ISO date if known else "",
  "messageId": the email id if available else "",
  "details": {
     // Decision:  { "decision": string, "reason": string }
     // Commitment:{ "owner": string, "task": string, "deadline": string, "status": "Open" }
     // Blocker:   { "issue": string, "severity": "High"|"Medium"|"Low", "status": "Open" }
     // Metric:    { "name": string, "old_value": string|number, "new_value": string|number, "change": string }
  }
}
Extract at most 12 items. If nothing is decision-grade, return [].`;

function safeJsonArray(text: string): Extracted[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
    return Array.isArray(parsed) ? (parsed as Extracted[]) : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const instance = await db.composioClawInstance.findUnique({
    where: { userId: session.user.id },
    select: { id: true, userId: true },
  });
  if (!instance) {
    return Response.json({ error: "no_instance" }, { status: 404 });
  }

  try {
    // 1. Fetch recent emails (compact - no full MIME payload).
    const composio = createComposioClient();
    const tools = await composio.tools.get(instance.userId, {
      tools: ["GMAIL_FETCH_EMAILS"],
    });
    const gmail = tools["GMAIL_FETCH_EMAILS"];
    if (!gmail?.execute) {
      return Response.json({ error: "gmail_not_connected" }, { status: 400 });
    }
    const emails = await gmail.execute(
      { max_results: 12, include_payload: false },
      { toolCallId: "founderops-extract", messages: [] },
    );

    // 2. LLM extraction pass (NIM).
    const result = await generateText({
      model: chatModel(instance.id),
      system: EXTRACTION_PROMPT,
      prompt: `Recent emails (JSON):\n${JSON.stringify(emails).slice(0, 24000)}`,
      maxOutputTokens: 2000,
    });
    const extracted = safeJsonArray(result.text);

    // 3. Persist typed records.
    let inserted = 0;
    for (const e of extracted) {
      if (!e.type || !e.title) continue;
      const occurredAt = e.occurredAt ? new Date(e.occurredAt) : new Date();
      await db.founderMemory.create({
        data: {
          instanceId: instance.id,
          type: e.type,
          title: e.title.slice(0, 300),
          content: (e.content ?? "").slice(0, 4000),
          occurredAt: isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
          source: "Gmail",
          author: e.author ?? "",
          messageId: e.messageId ?? null,
          linkToSource: e.linkToSource ?? null,
          details: (e.details ?? {}) as Prisma.InputJsonValue,
        },
      });
      inserted++;
    }

    return Response.json({ inserted, found: extracted.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "extract failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
