/**
 * Structured Extraction Engine — Module 3
 *
 * The core of the intelligence pipeline. For each signal event, calls the LLM
 * with a strict structured output prompt to extract typed memory records
 * (Decision, Commitment, Blocker, Metric) and persists them.
 *
 * Design notes:
 * - The extraction prompt is a const template, easy to update without code changes
 * - Validation is defensive: missing fields are logged and the record is skipped
 * - One event can produce multiple records (e.g., an email with a Decision AND a Blocker)
 * - Deduplication by messageId prevents re-processing on retry
 */

import { db, Prisma } from "../../server/clients/db";
import { callLLM } from "../../server/clients/ai";
import type {
  RawEvent,
  ExtractedRecord,
  ExtractedDecision,
  ExtractedCommitment,
  ExtractedBlocker,
  ExtractedMetric,
  MemoryType,
} from "./types";
import { logger } from "./types";

/* ------------------------------------------------------------------ */
/*  Extraction System Prompt                                           */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(todayDate: string): string {
  return `You are a founder intelligence extraction engine. Given a raw message from a startup founder's tools, extract ALL meaningful operational records.

You MUST return ONLY a valid JSON array. No preamble, no explanation, no markdown fences. Every object must conform to exactly one of these schemas:

{ "type": "Decision", "title": string, "content": string, "decision": string, "reason": string, "date": "YYYY-MM-DD" }
{ "type": "Commitment", "title": string, "content": string, "owner": string, "task": string, "deadline": "YYYY-MM-DD", "status": "Open" }
{ "type": "Blocker", "title": string, "content": string, "issue": string, "severity": "High"|"Medium"|"Low", "status": "Open" }
{ "type": "Metric", "title": string, "content": string, "name": string, "old_value": number, "new_value": number, "change": string }

Rules:
- One message can produce multiple records (e.g., a Decision AND a Blocker)
- If nothing is extractable, return []
- "title" = short label (max 60 chars)
- "content" = 1-2 sentence human summary
- Dates must be YYYY-MM-DD
- For Metrics, infer old_value/new_value from context (e.g., "MRR went from $1200 to $1500" → old_value: 1200, new_value: 1500, change: "+25%")
- If deadline is mentioned relatively ("tomorrow", "next week"), convert to absolute date. Today is ${todayDate}.
- If a severity or status is not explicitly stated, infer the most reasonable value from context.
- Be precise. Do not fabricate information that isn't in the source text.`;
}

/* ------------------------------------------------------------------ */
/*  Main Extraction Function                                           */
/* ------------------------------------------------------------------ */

/**
 * Extract structured memory records from a single raw event.
 *
 * Returns the IDs of all records created in the database.
 * Skips events that have already been processed (dedup by messageId).
 */
export async function extractFromEvent(
  event: RawEvent,
  instanceId: string
): Promise<string[]> {
  // Dedup check: skip if already processed
  const existing = await db.founderMemory.findFirst({
    where: { instanceId, messageId: event.id },
  });

  if (existing) {
    logger.info(`Extractor: skipping already-processed event ${event.source}:${event.id}`);
    return [];
  }

  const todayDate = formatDate(new Date());
  const systemPrompt = buildSystemPrompt(todayDate);

  const userPrompt = [
    `Source: ${event.source}`,
    `Author: ${event.author}`,
    `Date: ${event.occurredAt.toISOString()}`,
    `Content:`,
    event.content,
  ].join("\n");

  // Call LLM for extraction
  const response = await callLLM(systemPrompt, userPrompt, {
    temperature: 0.1,
    jsonMode: true,
  });

  // Parse the response
  const records = parseExtractionResponse(response);

  if (records.length === 0) {
    logger.info(`Extractor: no records extracted from ${event.source}:${event.id}`);
    return [];
  }

  // Persist each valid record
  const createdIds: string[] = [];

  for (const record of records) {
    try {
      const details = buildDetails(record);

      const created = await db.founderMemory.create({
        data: {
          instanceId,
          type: record.type,
          title: truncate(record.title, 60),
          content: record.content,
          occurredAt: event.occurredAt,
          source: event.source,
          author: event.author,
          messageId: event.id,
          linkToSource: event.linkToSource ?? null,
          rawContent: event.rawContent ?? event.content,
          relatedIds: [], // filled in by the linker (Module 4)
          details: details as Prisma.InputJsonValue,
        },
      });

      createdIds.push(created.id);

      logger.info(`Extractor: created ${record.type} record "${record.title}"`, {
        id: created.id,
        source: event.source,
      });
    } catch (error) {
      logger.error(`Extractor: failed to persist record "${record.title}"`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return createdIds;
}

/* ------------------------------------------------------------------ */
/*  Response Parsing & Validation                                      */
/* ------------------------------------------------------------------ */

/**
 * Parse the LLM response into validated ExtractedRecord objects.
 * Handles markdown-wrapped JSON, extra text, and partial arrays.
 */
function parseExtractionResponse(response: string): ExtractedRecord[] {
  const jsonStr = extractJsonArray(response);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    logger.warn("Extractor: could not parse LLM response as JSON", {
      response: response.slice(0, 200),
    });
    return [];
  }

  if (!Array.isArray(parsed)) {
    logger.warn("Extractor: LLM response is not an array", {
      type: typeof parsed,
    });
    return [];
  }

  const validated: ExtractedRecord[] = [];

  for (const item of parsed) {
    const record = validateRecord(item);
    if (record) {
      validated.push(record);
    }
  }

  return validated;
}

/**
 * Extract a JSON array string from potentially messy LLM output.
 * Handles:
 * - Clean JSON arrays
 * - JSON wrapped in markdown code fences
 * - JSON with leading/trailing text
 */
function extractJsonArray(text: string): string {
  const trimmed = text.trim();

  // Try as-is first
  if (trimmed.startsWith("[")) {
    return trimmed;
  }

  // Try extracting from markdown code fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  // Try finding the first [ ... ] in the text
  const bracketMatch = trimmed.match(/\[[\s\S]*\]/);
  if (bracketMatch?.[0]) {
    return bracketMatch[0];
  }

  // Last resort: return as-is and let JSON.parse fail
  return trimmed;
}

/**
 * Validate a raw parsed object against the expected record schemas.
 * Returns a typed ExtractedRecord or null if validation fails.
 */
function validateRecord(raw: unknown): ExtractedRecord | null {
  if (typeof raw !== "object" || raw === null) return null;

  const obj = raw as Record<string, unknown>;

  // Common required fields
  const type = obj["type"];
  const title = obj["title"];
  const content = obj["content"];

  if (typeof type !== "string" || typeof title !== "string" || typeof content !== "string") {
    logger.warn("Extractor: record missing type/title/content", { raw: JSON.stringify(obj).slice(0, 100) });
    return null;
  }

  const validTypes: MemoryType[] = ["Decision", "Commitment", "Blocker", "Metric"];
  if (!validTypes.includes(type as MemoryType)) {
    logger.warn(`Extractor: unknown record type "${type}"`);
    return null;
  }

  switch (type) {
    case "Decision":
      return validateDecision(obj, title, content);
    case "Commitment":
      return validateCommitment(obj, title, content);
    case "Blocker":
      return validateBlocker(obj, title, content);
    case "Metric":
      return validateMetric(obj, title, content);
    default:
      return null;
  }
}

function validateDecision(obj: Record<string, unknown>, title: string, content: string): ExtractedDecision | null {
  const decision = asString(obj["decision"]);
  const reason = asString(obj["reason"]);
  const date = asString(obj["date"]) ?? formatDate(new Date());

  if (!decision) {
    logger.warn("Extractor: Decision missing 'decision' field");
    return null;
  }

  return {
    type: "Decision",
    title,
    content,
    decision,
    reason: reason ?? "Not specified",
    date,
  };
}

function validateCommitment(obj: Record<string, unknown>, title: string, content: string): ExtractedCommitment | null {
  const owner = asString(obj["owner"]);
  const task = asString(obj["task"]);
  const deadline = asString(obj["deadline"]) ?? "TBD";

  if (!task) {
    logger.warn("Extractor: Commitment missing 'task' field");
    return null;
  }

  return {
    type: "Commitment",
    title,
    content,
    owner: owner ?? "Unassigned",
    task,
    deadline,
    status: "Open",
  };
}

function validateBlocker(obj: Record<string, unknown>, title: string, content: string): ExtractedBlocker | null {
  const issue = asString(obj["issue"]);
  const severity = asString(obj["severity"]);
  const validSeverities = ["High", "Medium", "Low"];

  if (!issue) {
    logger.warn("Extractor: Blocker missing 'issue' field");
    return null;
  }

  return {
    type: "Blocker",
    title,
    content,
    issue,
    severity: (validSeverities.includes(severity ?? "") ? severity : "Medium") as "High" | "Medium" | "Low",
    status: "Open",
  };
}

function validateMetric(obj: Record<string, unknown>, title: string, content: string): ExtractedMetric | null {
  const name = asString(obj["name"]);
  const oldValue = asNumber(obj["old_value"]);
  const newValue = asNumber(obj["new_value"]);
  const change = asString(obj["change"]);

  if (!name) {
    logger.warn("Extractor: Metric missing 'name' field");
    return null;
  }

  return {
    type: "Metric",
    title,
    content,
    name,
    old_value: oldValue ?? 0,
    new_value: newValue ?? 0,
    change: change ?? "N/A",
  };
}

/* ------------------------------------------------------------------ */
/*  Details Builder                                                    */
/* ------------------------------------------------------------------ */

/**
 * Build the `details` JSON payload for the FounderMemory record.
 * Maps extracted fields into the correct shape per memory type.
 */
function buildDetails(record: ExtractedRecord): Record<string, unknown> {
  switch (record.type) {
    case "Decision":
      return {
        decision: record.decision,
        reason: record.reason,
        date: record.date,
        blockerIds: [],
        metricIds: [],
      };

    case "Commitment":
      return {
        owner: record.owner,
        task: record.task,
        deadline: record.deadline,
        status: record.status,
      };

    case "Blocker":
      return {
        issue: record.issue,
        severity: record.severity,
        status: record.status,
      };

    case "Metric":
      return {
        name: record.name,
        old_value: record.old_value,
        new_value: record.new_value,
        change: record.change,
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function asString(val: unknown): string | null {
  return typeof val === "string" && val.trim().length > 0 ? val.trim() : null;
}

function asNumber(val: unknown): number | null {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(/[,$%]/g, ""));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + "…";
}
