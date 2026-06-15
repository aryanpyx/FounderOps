import { generateText } from "ai";
import { db, Prisma } from "~/server/clients/db";
import { chatModel } from "~/server/clients/ai";

interface Extracted {
  type: "Decision" | "Commitment" | "Blocker" | "Metric";
  title: string;
  content: string;
  author?: string;
  occurredAt?: string;
  details?: Record<string, unknown>;
}

const PROMPT = `You extract structured founder memory from text. Capture any DECISION, COMMITMENT, BLOCKER, or METRIC that is stated or clearly implied. The founder is often telling you these directly, so don't be overly strict - if they say "we decided X", "I'll do Y by Z", "we're blocked on W", or "MRR went from A to B", capture it.

Return ONLY a JSON array (no prose, no code fences). Each item:
{
  "type": "Decision" | "Commitment" | "Blocker" | "Metric",
  "title": short label,
  "content": one-sentence summary,
  "author": who (default "Founder"),
  "occurredAt": ISO date if stated else "",
  "details": {
     // Decision:  { "decision": string, "reason": string }
     // Commitment:{ "owner": string, "task": string, "deadline": string, "status": "Open" }
     // Blocker:   { "issue": string, "severity": "High"|"Medium"|"Low", "status": "Open" }
     // Metric:    { "name": string, "old_value": string|number, "new_value": string|number, "change": string }
  }
}
If the text contains no decision/commitment/blocker/metric (e.g. it's just a question or chit-chat), return [].`;

// Guarantees each record has the full set of fields its type needs, with sane
// defaults, so the UI never hits a missing field (graph status, metric delta, etc.).
function normalizeDetails(
  type: Extracted["type"],
  raw: Record<string, unknown> | undefined,
  title: string,
  content: string,
): Record<string, unknown> {
  const d = raw ?? {};
  const s = (k: string, fallback = "") =>
    typeof d[k] === "string" || typeof d[k] === "number" ? d[k] : fallback;
  switch (type) {
    case "Decision":
      return {
        decision: s("decision", title),
        reason: s("reason", content),
        date: s("date", new Date().toISOString().slice(0, 10)),
        blockerIds: [],
        metricIds: [],
      };
    case "Commitment":
      return {
        owner: s("owner", "Founder"),
        task: s("task", title),
        deadline: s("deadline", ""),
        status: s("status", "Open"),
      };
    case "Blocker":
      return {
        issue: s("issue", title),
        severity: s("severity", "Medium"),
        status: s("status", "Open"),
      };
    case "Metric":
      return {
        name: s("name", title),
        old_value: s("old_value", ""),
        new_value: s("new_value", ""),
        change: s("change", ""),
      };
    default:
      return d;
  }
}

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

// Runs an LLM extraction pass over `content` and persists any typed records.
export async function extractMemories(
  instanceId: string,
  content: string,
  source: string,
  defaultAuthor = "Founder",
): Promise<{ inserted: number; found: number }> {
  const result = await generateText({
    model: chatModel(instanceId),
    system: PROMPT,
    prompt: content.slice(0, 24000),
    maxOutputTokens: 1500,
  });

  const extracted = safeJsonArray(result.text);
  let inserted = 0;
  for (const e of extracted) {
    if (!e.type || !e.title) continue;
    const when = e.occurredAt ? new Date(e.occurredAt) : new Date();
    await db.founderMemory.create({
      data: {
        instanceId,
        type: e.type,
        title: e.title.slice(0, 300),
        content: (e.content ?? "").slice(0, 4000),
        occurredAt: isNaN(when.getTime()) ? new Date() : when,
        source,
        author: e.author ?? defaultAuthor,
        details: normalizeDetails(
          e.type,
          e.details,
          e.title ?? "",
          e.content ?? "",
        ) as Prisma.InputJsonValue,
      },
    });
    inserted++;
  }
  return { inserted, found: extracted.length };
}
