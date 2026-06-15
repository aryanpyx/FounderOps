/**
 * Decision Recovery — Module 5 (Prompts)
 *
 * Answers a founder's question like "why did we delay launch?" by searching
 * the memory for relevant Decision records, fetching linked Blockers and
 * Metrics, and asking the LLM to synthesize a cited answer.
 */

import { db } from "../../../server/clients/db";
import { callLLM } from "../../../server/clients/ai";
import { logger } from "../types";

/* ------------------------------------------------------------------ */
/*  System Prompt                                                      */
/* ------------------------------------------------------------------ */

const DECISION_RECOVERY_SYSTEM_PROMPT = `You are FounderOps, an AI chief of staff with perfect recall of the founder's operational history. A founder is asking a question about a past decision, event, or metric.

Answer using ONLY the memory records provided below. Do not make up information.

Rules:
- Cite the source for every claim: [Source: Gmail, 2024-01-15] or [Source: Slack, by @alice]
- If multiple records are relevant, synthesize them into a coherent narrative
- If linked Blockers or Metrics provide additional context, include them
- If the memory records don't contain enough information to answer, say so explicitly
- Be concise but thorough
- If dates are relevant, include them
- End with a "Related Records" section listing the IDs/titles of records you referenced`;

/* ------------------------------------------------------------------ */
/*  Decision Recovery Function                                         */
/* ------------------------------------------------------------------ */

/**
 * Answer a founder's question by searching memory and synthesizing.
 *
 * 1. Search founder_memory for relevant Decision records (keyword search)
 * 2. Fetch linked Blockers and Metrics via relatedIds
 * 3. Call LLM with the question + context
 * 4. Return cited answer
 *
 * TODO: When pgvector is available, replace keyword search with semantic
 * similarity search (embed the question → cosine similarity against records)
 */
export async function recoverDecision(
  instanceId: string,
  question: string
): Promise<string> {
  logger.info("Decision recovery: searching for relevant records", { instanceId, question });

  // Step 1: Find relevant decisions via keyword matching
  // (In production, this should use semantic search via pgvector)
  const keywords = extractSearchKeywords(question);

  const allDecisions = await db.founderMemory.findMany({
    where: { instanceId, type: "Decision" },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  // Score and rank decisions by keyword relevance
  const scoredDecisions = allDecisions
    .map((d) => ({
      record: d,
      score: scoreRelevance(keywords, `${d.title} ${d.content}`),
    }))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Step 2: Fetch linked records (Blockers, Metrics) for top decisions
  const relatedIds = new Set<string>();
  for (const { record } of scoredDecisions) {
    for (const id of record.relatedIds) {
      relatedIds.add(id);
    }
  }

  let linkedRecords: Array<{ id: string; type: string; title: string; content: string; details: unknown; source: string; occurredAt: Date }> = [];

  if (relatedIds.size > 0) {
    linkedRecords = await db.founderMemory.findMany({
      where: { instanceId, id: { in: Array.from(relatedIds) } },
    });
  }

  // Also search Blockers and Metrics directly for the question keywords
  const [relevantBlockers, relevantMetrics] = await Promise.all([
    db.founderMemory.findMany({
      where: { instanceId, type: "Blocker" },
      orderBy: { occurredAt: "desc" },
      take: 50,
    }),
    db.founderMemory.findMany({
      where: { instanceId, type: "Metric" },
      orderBy: { occurredAt: "desc" },
      take: 50,
    }),
  ]);

  const scoredBlockers = relevantBlockers
    .filter((b) => scoreRelevance(keywords, `${b.title} ${b.content}`) > 0)
    .slice(0, 5);

  const scoredMetrics = relevantMetrics
    .filter((m) => scoreRelevance(keywords, `${m.title} ${m.content}`) > 0)
    .slice(0, 5);

  // Step 3: Build context and call LLM
  const totalRecords = scoredDecisions.length + linkedRecords.length + scoredBlockers.length + scoredMetrics.length;

  if (totalRecords === 0) {
    return `I don't have enough information in the memory to answer: "${question}"\n\nThis could mean:\n- The relevant conversations haven't been ingested yet\n- The topic wasn't captured as a Decision, Blocker, or Metric\n- Try running a fresh ingestion cycle and asking again`;
  }

  const context = buildRecoveryContext({
    question,
    decisions: scoredDecisions.map((d) => d.record),
    linkedRecords,
    blockers: scoredBlockers,
    metrics: scoredMetrics,
  });

  const answer = await callLLM(DECISION_RECOVERY_SYSTEM_PROMPT, context, {
    temperature: 0.2,
    maxTokens: 2048,
  });

  logger.info("Decision recovery: answer generated", { totalRecords });
  return answer;
}

/* ------------------------------------------------------------------ */
/*  Search Utilities                                                   */
/* ------------------------------------------------------------------ */

/** Extract meaningful search keywords from a question */
function extractSearchKeywords(question: string): string[] {
  const stopWords = new Set([
    "what", "when", "where", "why", "how", "who", "which",
    "did", "do", "does", "was", "were", "is", "are", "am",
    "the", "a", "an", "in", "on", "at", "to", "for", "of",
    "we", "i", "you", "they", "he", "she", "it",
    "our", "my", "your", "his", "her", "its", "their",
    "and", "or", "but", "not", "no",
    "about", "with", "from",
  ]);

  return question
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word));
}

/** Score a text's relevance to a set of keywords */
function scoreRelevance(keywords: string[], text: string): number {
  const textLower = text.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    if (textLower.includes(keyword)) {
      score++;
    }
  }

  return score;
}

/* ------------------------------------------------------------------ */
/*  Context Builder                                                    */
/* ------------------------------------------------------------------ */

interface RecoveryContextInput {
  question: string;
  decisions: Array<{ id: string; title: string; content: string; details: unknown; source: string; author: string; occurredAt: Date }>;
  linkedRecords: Array<{ id: string; type: string; title: string; content: string; details: unknown; source: string; occurredAt: Date }>;
  blockers: Array<{ id: string; title: string; content: string; details: unknown; source: string; occurredAt: Date }>;
  metrics: Array<{ id: string; title: string; content: string; details: unknown; source: string; occurredAt: Date }>;
}

function buildRecoveryContext(input: RecoveryContextInput): string {
  const sections: string[] = [];

  sections.push(`QUESTION: ${input.question}`);

  sections.push(`\n=== RELEVANT DECISIONS ===`);
  for (const d of input.decisions) {
    const details = d.details as Record<string, unknown>;
    sections.push(`[ID: ${d.id}] [${formatDate(d.occurredAt)}] [Source: ${d.source}, by ${d.author}]`);
    sections.push(`  Title: ${d.title}`);
    sections.push(`  ${d.content}`);
    sections.push(`  Decision: ${details["decision"] ?? "N/A"}`);
    sections.push(`  Reason: ${details["reason"] ?? "N/A"}`);
  }

  if (input.linkedRecords.length > 0) {
    sections.push(`\n=== LINKED RECORDS ===`);
    for (const r of input.linkedRecords) {
      sections.push(`[ID: ${r.id}] [${r.type}] [${formatDate(r.occurredAt)}] [Source: ${r.source}]`);
      sections.push(`  ${r.title}: ${r.content}`);
    }
  }

  if (input.blockers.length > 0) {
    sections.push(`\n=== RELATED BLOCKERS ===`);
    for (const b of input.blockers) {
      const details = b.details as Record<string, unknown>;
      sections.push(`[ID: ${b.id}] [${formatDate(b.occurredAt)}] [Source: ${b.source}]`);
      sections.push(`  ${b.title}: ${b.content} (Severity: ${details["severity"] ?? "?"})`);
    }
  }

  if (input.metrics.length > 0) {
    sections.push(`\n=== RELATED METRICS ===`);
    for (const m of input.metrics) {
      const details = m.details as Record<string, unknown>;
      sections.push(`[ID: ${m.id}] [${formatDate(m.occurredAt)}] [Source: ${m.source}]`);
      sections.push(`  ${details["name"] ?? m.title}: ${details["old_value"] ?? "?"} → ${details["new_value"] ?? "?"} (${details["change"] ?? "?"})`);
    }
  }

  return sections.join("\n");
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
