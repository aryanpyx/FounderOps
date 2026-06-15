/**
 * Ingestion adapter registry and parallel runner.
 *
 * All source adapters are registered here. Adding a new source is:
 * 1. Create the adapter file (e.g., ingest/linear.ts)
 * 2. Add one entry to the ADAPTER_REGISTRY below
 *
 * ingestAll() runs all enabled adapters in parallel with Promise.allSettled
 * so a single source failure never crashes the whole ingestion cycle.
 */

import type { RawEvent, SourceName, AdapterRegistration } from "../types";
import { logger } from "../types";
import { ingestGmail } from "./gmail";
import { ingestSlack } from "./slack";
import { ingestNotion } from "./notion";
import { ingestCalendar } from "./calendar";
import { ingestStripe } from "./stripe";

/* ------------------------------------------------------------------ */
/*  Adapter Registry                                                   */
/* ------------------------------------------------------------------ */

/**
 * Register all source adapters here.
 * Set `enabled: false` to temporarily disable a source without removing code.
 */
const ADAPTER_REGISTRY: AdapterRegistration[] = [
  { name: "Gmail", adapter: ingestGmail, enabled: true },
  { name: "Slack", adapter: ingestSlack, enabled: true },
  { name: "Notion", adapter: ingestNotion, enabled: true },
  { name: "Calendar", adapter: ingestCalendar, enabled: true },
  { name: "Stripe", adapter: ingestStripe, enabled: true },
];

/* ------------------------------------------------------------------ */
/*  Parallel Ingestion Runner                                          */
/* ------------------------------------------------------------------ */

export interface IngestAllResult {
  events: RawEvent[];
  sourceBreakdown: Record<string, { fetched: number; errors: number }>;
}

/**
 * Run all enabled ingestion adapters in parallel.
 *
 * - Uses Promise.allSettled so one source failing doesn't block others
 * - Collects per-source stats and errors
 * - Returns a flattened array of all RawEvents
 */
export async function ingestAll(instanceId: string): Promise<IngestAllResult> {
  const enabledAdapters = ADAPTER_REGISTRY.filter((a) => a.enabled);

  logger.info(`Starting parallel ingestion for ${enabledAdapters.length} sources`, {
    sources: enabledAdapters.map((a) => a.name),
  });

  const results = await Promise.allSettled(
    enabledAdapters.map(async (registration) => {
      const startMs = Date.now();
      const events = await registration.adapter(instanceId);
      const durationMs = Date.now() - startMs;

      logger.info(`${registration.name}: fetched ${events.length} events in ${durationMs}ms`);

      return { name: registration.name, events };
    })
  );

  const allEvents: RawEvent[] = [];
  const sourceBreakdown: Record<string, { fetched: number; errors: number }> = {};

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    const adapterName = enabledAdapters[i]!.name;

    if (result.status === "fulfilled") {
      allEvents.push(...result.value.events);
      sourceBreakdown[adapterName] = { fetched: result.value.events.length, errors: 0 };
    } else {
      const errorMessage = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);

      logger.error(`${adapterName}: ingestion failed — ${errorMessage}`);
      sourceBreakdown[adapterName] = { fetched: 0, errors: 1 };
    }
  }

  logger.info(`Ingestion complete: ${allEvents.length} total events from ${enabledAdapters.length} sources`);

  return { events: allEvents, sourceBreakdown };
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

/** Get the list of all registered adapter names (enabled and disabled) */
export function getRegisteredSources(): SourceName[] {
  return ADAPTER_REGISTRY.map((a) => a.name);
}

/** Check if a specific source is enabled */
export function isSourceEnabled(name: SourceName): boolean {
  return ADAPTER_REGISTRY.some((a) => a.name === name && a.enabled);
}
