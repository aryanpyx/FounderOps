/**
 * Weekly Review Generator — Module 5 (Prompts)
 *
 * Generates a structured weekly retrospective by querying the last 7 days
 * of memory records and producing an analytical summary.
 */

import { db } from "../../../server/clients/db";
import { callLLM } from "../../../server/clients/ai";
import { logger } from "../types";

/* ------------------------------------------------------------------ */
/*  System Prompt                                                      */
/* ------------------------------------------------------------------ */

const WEEKLY_REVIEW_SYSTEM_PROMPT = `You are FounderOps, an AI chief of staff. Generate a weekly review that helps the founder reflect on what happened and plan ahead. Be analytical and opinionated.

Format:

## 📊 Week at a Glance
[1-2 sentence summary of the overall week]

## 🎯 Major Decisions This Week ([count])
[List each decision with date, context, and impact assessment]

## 🔴 Blockers: Resolved vs Still Open
Resolved: [count]
[list resolved blockers with resolution]
Still Open: [count]
[list open blockers with severity and age in days]

## ✅ Commitments: Hit vs Missed
Hit: [count] / Total: [count]
[list fulfilled commitments]
Missed/Overdue: [count]
[list missed commitments with owner and original deadline]

## 📈 Business Metrics Movement
[list each metric change with trend analysis]

## ⚠️ What Needs Attention Next Week
[3-5 specific items the founder should prioritize, based on patterns in the data]

## 💡 Patterns & Observations
[1-3 insights about recurring themes, bottlenecks, or positive trends]

Rules:
- Be direct and analytical. No filler.
- If a section has no data, say "No [type] recorded this week."
- The "Patterns & Observations" section should surface non-obvious insights.
- Use specific dates and numbers wherever possible.`;

/* ------------------------------------------------------------------ */
/*  Review Generator                                                   */
/* ------------------------------------------------------------------ */

/**
 * Generate a weekly review for the given instance.
 *
 * 1. Queries last 7 days of founder_memory
 * 2. Groups and summarizes records by type
 * 3. Sends to LLM for synthesis
 * 4. Returns the markdown review
 */
export async function generateWeeklyReview(instanceId: string): Promise<string> {
  logger.info("Weekly review: generating", { instanceId });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [blockers, decisions, commitments, metrics] = await Promise.all([
    db.founderMemory.findMany({
      where: { instanceId, type: "Blocker", occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
    }),
    db.founderMemory.findMany({
      where: { instanceId, type: "Decision", occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
    }),
    db.founderMemory.findMany({
      where: { instanceId, type: "Commitment", occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
    }),
    db.founderMemory.findMany({
      where: { instanceId, type: "Metric", occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
    }),
  ]);

  const totalRecords = blockers.length + decisions.length + commitments.length + metrics.length;

  if (totalRecords === 0) {
    logger.info("Weekly review: no records found in last 7 days");
    return "# Weekly Review\n\nNo activity recorded in the last 7 days. The intelligence engine may need to run more ingestion cycles.";
  }

  // Build richer context for weekly analysis
  const userPrompt = buildWeeklyContext({
    blockers, decisions, commitments, metrics,
    weekStart: since,
    weekEnd: new Date(),
  });

  const review = await callLLM(WEEKLY_REVIEW_SYSTEM_PROMPT, userPrompt, {
    temperature: 0.4,
    maxTokens: 4096,
  });

  logger.info("Weekly review: generated successfully", { totalRecords });
  return review;
}

/* ------------------------------------------------------------------ */
/*  Context Builder                                                    */
/* ------------------------------------------------------------------ */

interface WeeklyContextInput {
  blockers: Array<{ title: string; content: string; details: unknown; source: string; author: string; occurredAt: Date }>;
  decisions: Array<{ title: string; content: string; details: unknown; source: string; author: string; occurredAt: Date }>;
  commitments: Array<{ title: string; content: string; details: unknown; source: string; author: string; occurredAt: Date }>;
  metrics: Array<{ title: string; content: string; details: unknown; source: string; author: string; occurredAt: Date }>;
  weekStart: Date;
  weekEnd: Date;
}

function buildWeeklyContext(input: WeeklyContextInput): string {
  const { blockers, decisions, commitments, metrics, weekStart, weekEnd } = input;
  const sections: string[] = [];

  sections.push(`Week: ${formatDate(weekStart)} to ${formatDate(weekEnd)}`);
  sections.push(`Total records: ${blockers.length + decisions.length + commitments.length + metrics.length}`);

  sections.push(`\n=== DECISIONS (${decisions.length}) ===`);
  for (const d of decisions) {
    const details = d.details as Record<string, unknown>;
    sections.push(`- [${formatDate(d.occurredAt)}] ${d.title}: ${d.content} | Reason: ${details["reason"] ?? "N/A"} | Source: ${d.source} | By: ${d.author}`);
  }

  sections.push(`\n=== BLOCKERS (${blockers.length}) ===`);
  for (const b of blockers) {
    const details = b.details as Record<string, unknown>;
    sections.push(`- [${formatDate(b.occurredAt)}] [${details["severity"] ?? "?"}] [${details["status"] ?? "?"}] ${b.title}: ${b.content} | Source: ${b.source}`);
  }

  sections.push(`\n=== COMMITMENTS (${commitments.length}) ===`);
  for (const c of commitments) {
    const details = c.details as Record<string, unknown>;
    sections.push(`- [${formatDate(c.occurredAt)}] ${c.title}: ${details["task"] ?? c.content} | Owner: ${details["owner"] ?? "?"} | Deadline: ${details["deadline"] ?? "TBD"} | Status: ${details["status"] ?? "Open"}`);
  }

  sections.push(`\n=== METRICS (${metrics.length}) ===`);
  for (const m of metrics) {
    const details = m.details as Record<string, unknown>;
    sections.push(`- [${formatDate(m.occurredAt)}] ${details["name"] ?? m.title}: ${details["old_value"] ?? "?"} → ${details["new_value"] ?? "?"} (${details["change"] ?? "?"})`);
  }

  return sections.join("\n");
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
