/**
 * Signal Filter — Module 2
 *
 * A two-pass filter that separates signal from noise BEFORE any expensive
 * LLM extraction call. This dramatically reduces cost and latency.
 *
 * Pass 1: Keyword heuristics (free, instant)
 * Pass 2: LLM batch classification for borderline cases (cheap, one call)
 */

import { callLLM } from "../../server/clients/ai";
import type { RawEvent } from "./types";
import { logger } from "./types";

/* ------------------------------------------------------------------ */
/*  Configurable Keyword Lists                                         */
/* ------------------------------------------------------------------ */

/** Keywords that strongly indicate a signal — presence → KEEP */
const SIGNAL_KEYWORDS = new Set([
  "decided",
  "decision",
  "we'll",
  "we will",
  "postpone",
  "postponed",
  "delay",
  "delayed",
  "increase",
  "increased",
  "decrease",
  "decreased",
  "blocked",
  "blocking",
  "blocker",
  "can't",
  "cannot",
  "failing",
  "failed",
  "committed",
  "commit",
  "i'll",
  "i will",
  "by tomorrow",
  "by monday",
  "by friday",
  "by end of",
  "deadline",
  "due date",
  "mrr",
  "revenue",
  "arr",
  "churn",
  "pricing",
  "launch",
  "ship",
  "shipped",
  "raised",
  "funding",
  "runway",
  "burn rate",
  "conversion",
  "pipeline",
  "closed deal",
  "lost deal",
  "hired",
  "fired",
  "resigned",
  "onboarding",
  "milestone",
  "pivot",
  "strategy",
  "prioritize",
  "deprioritize",
  "escalate",
  "critical",
  "urgent",
  "outage",
  "downtime",
  "incident",
]);

/** Patterns that strongly indicate noise — presence → DROP */
const NOISE_PATTERNS = [
  /^[\p{Emoji}\s]+$/u,                           // pure emoji
  /^(thanks|thank you|thx|ty|ok|okay|sure|lgtm|\+1|👍|🎉|✅|❤️|💯)\.?$/i,
  /^(sounds good|got it|noted|ack|roger|will do|on it|np|no problem)\.?$/i,
  /newsletter/i,
  /unsubscribe/i,
  /view in browser/i,
  /you are receiving this because/i,
  /do not reply to this email/i,
  /automated message/i,
  /noreply@/i,
  /standup bot/i,
  /daily standup summary/i,
  /reminder: /i,                                  // calendar ping reminders
  /your meeting .* is starting/i,
];

/** Domains that typically send newsletters / marketing (noise) */
const NEWSLETTER_DOMAINS = new Set([
  "substack.com",
  "mailchimp.com",
  "sendgrid.net",
  "constantcontact.com",
  "hubspot.com",
  "marketing.",
  "news@",
  "digest@",
  "updates@",
  "noreply@",
  "no-reply@",
]);

/** Minimum word count for content to be considered non-trivial */
const MIN_WORDS_THRESHOLD = 15;

/** Word count boundaries for the "borderline" zone */
const BORDERLINE_MIN_WORDS = 15;
const BORDERLINE_MAX_WORDS = 200;

/* ------------------------------------------------------------------ */
/*  Filter Implementation                                              */
/* ------------------------------------------------------------------ */

type FilterVerdict = "signal" | "noise" | "borderline";

/**
 * Filter a list of raw events to keep only meaningful signals.
 *
 * Returns only the events worth sending to the extraction engine.
 */
export async function filterSignals(events: RawEvent[]): Promise<RawEvent[]> {
  if (events.length === 0) return [];

  logger.info(`Signal filter: processing ${events.length} events`);

  const signals: RawEvent[] = [];
  const borderlineEvents: RawEvent[] = [];

  // Pass 1: heuristic classification
  for (const event of events) {
    const verdict = classifyHeuristic(event);

    switch (verdict) {
      case "signal":
        signals.push(event);
        break;
      case "borderline":
        borderlineEvents.push(event);
        break;
      case "noise":
        // dropped
        break;
    }
  }

  logger.info(
    `Signal filter pass 1: ${signals.length} signals, ${borderlineEvents.length} borderline, ` +
    `${events.length - signals.length - borderlineEvents.length} noise`
  );

  // Pass 2: LLM classification for borderline events
  if (borderlineEvents.length > 0) {
    const llmSignals = await classifyBorderlineWithLLM(borderlineEvents);
    signals.push(...llmSignals);

    logger.info(`Signal filter pass 2: ${llmSignals.length}/${borderlineEvents.length} borderline → signal`);
  }

  logger.info(`Signal filter complete: ${signals.length}/${events.length} events kept`);
  return signals;
}

/* ------------------------------------------------------------------ */
/*  Pass 1: Heuristic Classification                                   */
/* ------------------------------------------------------------------ */

function classifyHeuristic(event: RawEvent): FilterVerdict {
  const content = event.content;
  const contentLower = content.toLowerCase();
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // --- Definite NOISE ---

  // Check noise patterns
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(content)) {
      return "noise";
    }
  }

  // Check newsletter domain in author field
  const authorLower = (event.author ?? "").toLowerCase();
  for (const domain of NEWSLETTER_DOMAINS) {
    if (authorLower.includes(domain)) {
      return "noise";
    }
  }

  // Too short with no signal keywords
  if (wordCount < MIN_WORDS_THRESHOLD && !hasSignalKeyword(contentLower)) {
    return "noise";
  }

  // --- Definite SIGNAL ---

  // All Stripe events are signals (already pre-filtered in the adapter)
  if (event.source === "Stripe") {
    return "signal";
  }

  // Contains strong signal keywords
  if (hasSignalKeyword(contentLower)) {
    return "signal";
  }

  // Long messages with question marks (likely decisions/discussions)
  if (wordCount > BORDERLINE_MAX_WORDS && content.includes("?")) {
    return "signal";
  }

  // --- BORDERLINE (needs LLM) ---
  if (wordCount >= BORDERLINE_MIN_WORDS && wordCount <= BORDERLINE_MAX_WORDS) {
    return "borderline";
  }

  // Default: longer messages without signal keywords → borderline
  return "borderline";
}

function hasSignalKeyword(contentLower: string): boolean {
  for (const keyword of SIGNAL_KEYWORDS) {
    if (contentLower.includes(keyword)) {
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Pass 2: LLM Batch Classification                                   */
/* ------------------------------------------------------------------ */

/**
 * Batch classify borderline events with a single LLM call.
 *
 * NOTE: The batch size limit will be configured later once the NIM
 * endpoint's token limits are confirmed. Currently batches all events
 * in a single call.
 *
 * TODO: Ask about NIM token/message limits and add batching logic if needed.
 */
async function classifyBorderlineWithLLM(events: RawEvent[]): Promise<RawEvent[]> {
  if (events.length === 0) return [];

  const systemPrompt = `You are a signal/noise classifier for a startup founder's operational messages.
For each message below, classify it as "signal" or "noise".
- "signal" = contains a decision, commitment, blocker, metric change, or any operationally meaningful information
- "noise" = small talk, acknowledgments, notifications, marketing, or content with no actionable information

Return ONLY a JSON array of strings, one per message, in the same order.
Example: ["signal", "noise", "signal"]
No other output.`;

  const userPrompt = events
    .map((e, i) => `[${i + 1}] (${e.source}) ${e.content.slice(0, 300)}`)
    .join("\n\n");

  try {
    const response = await callLLM(systemPrompt, userPrompt, {
      temperature: 0,
      jsonMode: true,
    });

    const verdicts = parseClassificationResponse(response, events.length);
    const signals: RawEvent[] = [];

    for (let i = 0; i < events.length; i++) {
      const verdict = verdicts[i];
      if (verdict === "signal") {
        signals.push(events[i]!);
      }
    }

    return signals;
  } catch (error) {
    // If LLM classification fails, err on the side of keeping events
    logger.warn("LLM signal classification failed — keeping all borderline events", {
      error: error instanceof Error ? error.message : String(error),
    });
    return events;
  }
}

/**
 * Parse the LLM's classification response.
 * Handles various response formats robustly.
 */
function parseClassificationResponse(response: string, expectedCount: number): string[] {
  try {
    // Try direct JSON parse
    const parsed: unknown = JSON.parse(response);

    // Handle { "classifications": [...] } wrapper
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const arrField = Object.values(obj).find(Array.isArray);
      if (Array.isArray(arrField)) {
        return normalizeVerdicts(arrField as string[], expectedCount);
      }
    }

    if (Array.isArray(parsed)) {
      return normalizeVerdicts(parsed as string[], expectedCount);
    }
  } catch {
    // Try extracting JSON array from text
    const match = response.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const extracted: unknown = JSON.parse(match[0]);
        if (Array.isArray(extracted)) {
          return normalizeVerdicts(extracted as string[], expectedCount);
        }
      } catch {
        // fall through
      }
    }
  }

  // Fallback: keep everything (err on the side of signal)
  logger.warn("Could not parse LLM classification response — keeping all as signal");
  return new Array(expectedCount).fill("signal") as string[];
}

/** Normalize verdict strings and pad/truncate to expected length */
function normalizeVerdicts(verdicts: string[], expectedCount: number): string[] {
  const normalized = verdicts.map((v) => {
    const lower = String(v).toLowerCase().trim();
    return lower === "signal" ? "signal" : "noise";
  });

  // Pad with "signal" if LLM returned fewer than expected (err on keeping)
  while (normalized.length < expectedCount) {
    normalized.push("signal");
  }

  return normalized.slice(0, expectedCount);
}
