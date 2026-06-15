/**
 * Daily Brief Generator — Module 5 (Prompts)
 *
 * Generates an opinionated morning briefing for the founder by querying
 * the last 24h of memory records, grouping them, and asking the LLM
 * to produce a concise, actionable brief.
 */

import { db } from "../../../server/clients/db";
import { callLLM } from "../../../server/clients/ai";
import { logger } from "../types";

/* ------------------------------------------------------------------ */
/*  System Prompt                                                      */
/* ------------------------------------------------------------------ */

const DAILY_BRIEF_SYSTEM_PROMPT = `You are FounderOps, an AI chief of staff for a startup founder. Generate a concise, opinionated morning brief. Be direct — no filler, no pleasantries.

Format:

🔴 Open Blockers ([count])
[list each, one line — include severity and source]

✅ Decisions Made Yesterday ([count])
[list each with reason, one line]

📋 Commitments Due / Overdue ([count])
[list each with owner + deadline]

📈 Metric Changes
[list each with % change and direction]

🎯 Recommended Priority Today
[1-3 specific actions the founder should take, based on the above data]

Rules:
- Keep each section to max 5 items. If more exist, show top 5 and note the count.
- Be brutally concise. Each bullet = one line.
- The "Recommended Priority" section should be actionable and specific.
- If a section has zero items, say "None" instead of omitting it.
- If no data at all, say "No activity recorded in the last 24 hours."`;

/* ------------------------------------------------------------------ */
/*  Brief Generator                                                    */
/* ------------------------------------------------------------------ */

/**
 * Generate a daily morning brief for the given instance.
 *
 * 1. Queries last 24h of founder_memory
 * 2. Groups records by type
 * 3. Sends grouped context to LLM
 * 4. Returns the markdown brief
 */
export async function generateDailyBrief(instanceId: string): Promise<string> {
  logger.info("Daily brief: generating", { instanceId });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fetch recent records grouped by type
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
    logger.info("Daily brief: no records found in last 24h");
    return "# Daily Brief\n\nNo activity recorded in the last 24 hours. Check back after the next ingestion cycle.";
  }

  // Build context for the LLM
  const userPrompt = buildBriefContext({ blockers, decisions, commitments, metrics });

  const brief = await callLLM(DAILY_BRIEF_SYSTEM_PROMPT, userPrompt, {
    temperature: 0.3,
    maxTokens: 2048,
  });

  logger.info("Daily brief: generated successfully", { totalRecords });
  return brief;
}

/* ------------------------------------------------------------------ */
/*  Context Builder                                                    */
/* ------------------------------------------------------------------ */

interface GroupedRecords {
  blockers: Array<{ title: string; content: string; details: unknown; source: string; author: string }>;
  decisions: Array<{ title: string; content: string; details: unknown; source: string; author: string }>;
  commitments: Array<{ title: string; content: string; details: unknown; source: string; author: string }>;
  metrics: Array<{ title: string; content: string; details: unknown; source: string; author: string }>;
}

function buildBriefContext(groups: GroupedRecords): string {
  const sections: string[] = [];

  sections.push(`=== BLOCKERS (${groups.blockers.length}) ===`);
  if (groups.blockers.length > 0) {
    for (const b of groups.blockers) {
      const details = b.details as Record<string, unknown>;
      sections.push(`- [${details["severity"] ?? "Medium"}] ${b.title}: ${b.content} (from ${b.source})`);
    }
  } else {
    sections.push("(none)");
  }

  sections.push(`\n=== DECISIONS (${groups.decisions.length}) ===`);
  if (groups.decisions.length > 0) {
    for (const d of groups.decisions) {
      const details = d.details as Record<string, unknown>;
      sections.push(`- ${d.title}: ${d.content} | Reason: ${details["reason"] ?? "N/A"} (from ${d.source}, by ${d.author})`);
    }
  } else {
    sections.push("(none)");
  }

  sections.push(`\n=== COMMITMENTS (${groups.commitments.length}) ===`);
  if (groups.commitments.length > 0) {
    for (const c of groups.commitments) {
      const details = c.details as Record<string, unknown>;
      sections.push(`- ${c.title}: ${details["task"] ?? c.content} | Owner: ${details["owner"] ?? "?"} | Deadline: ${details["deadline"] ?? "TBD"} | Status: ${details["status"] ?? "Open"}`);
    }
  } else {
    sections.push("(none)");
  }

  sections.push(`\n=== METRICS (${groups.metrics.length}) ===`);
  if (groups.metrics.length > 0) {
    for (const m of groups.metrics) {
      const details = m.details as Record<string, unknown>;
      sections.push(`- ${details["name"] ?? m.title}: ${details["old_value"] ?? "?"} → ${details["new_value"] ?? "?"} (${details["change"] ?? "?"})`);
    }
  } else {
    sections.push("(none)");
  }

  return sections.join("\n");
}
