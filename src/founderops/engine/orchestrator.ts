/**
 * Ingestion Orchestrator — Module 6
 *
 * The main entry point that chains the entire pipeline:
 * ingest → filter → extract → link
 *
 * Returns detailed stats about the cycle for monitoring and debugging.
 */

import type { IngestionResult } from "./types";
import { logger } from "./types";
import { ingestAll } from "./ingest/index";
import { filterSignals } from "./signal-filter";
import { extractFromEvent } from "./extractor";
import { linkRecords } from "./linker";

/**
 * Run a full ingestion cycle for the given instance.
 *
 * This is the function that gets called by:
 * - The API route POST /api/founderops/engine/ingest
 * - The scheduler (hourly cron)
 * - Manual triggers
 *
 * It never throws — all errors are collected and returned in the result.
 */
export async function runIngestionCycle(instanceId: string): Promise<IngestionResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  logger.info("========================================");
  logger.info(`Ingestion cycle starting for instance: ${instanceId}`);
  logger.info("========================================");

  // ── Step 1: Ingest from all sources ────────────────────────────
  let ingestResult;
  try {
    ingestResult = await ingestAll(instanceId);
  } catch (error) {
    const msg = `Ingestion failed entirely: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(msg);
    errors.push(msg);

    return {
      ingested: 0,
      filtered: 0,
      extracted: 0,
      linked: 0,
      errors,
      sourceBreakdown: {},
      durationMs: Date.now() - startTime,
    };
  }

  const rawEvents = ingestResult.events;
  logger.info(`Step 1 complete: ${rawEvents.length} raw events ingested`);

  // ── Step 2: Filter signals ─────────────────────────────────────
  let signals;
  try {
    signals = await filterSignals(rawEvents);
  } catch (error) {
    const msg = `Signal filtering failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(msg);
    errors.push(msg);
    // Fall back to using all events (skip filtering)
    signals = rawEvents;
    logger.warn("Falling back to unfiltered events");
  }

  logger.info(`Step 2 complete: ${signals.length}/${rawEvents.length} events passed filter`);

  // ── Step 3: Extract records from each signal ───────────────────
  let totalExtracted = 0;

  for (const event of signals) {
    try {
      const recordIds = await extractFromEvent(event, instanceId);
      totalExtracted += recordIds.length;
    } catch (error) {
      const msg = `Extract failed for ${event.source}:${event.id}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(msg);
      errors.push(msg);
    }
  }

  logger.info(`Step 3 complete: ${totalExtracted} records extracted from ${signals.length} signals`);

  // ── Step 4: Link records ───────────────────────────────────────
  let linkedCount = 0;

  try {
    linkedCount = await linkRecords(instanceId);
  } catch (error) {
    const msg = `Record linking failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(msg);
    errors.push(msg);
  }

  logger.info(`Step 4 complete: ${linkedCount} links created`);

  // ── Summary ────────────────────────────────────────────────────
  const durationMs = Date.now() - startTime;

  const result: IngestionResult = {
    ingested: rawEvents.length,
    filtered: signals.length,
    extracted: totalExtracted,
    linked: linkedCount,
    errors,
    sourceBreakdown: ingestResult.sourceBreakdown,
    durationMs,
  };

  logger.info("========================================");
  logger.info("Ingestion cycle complete", {
    ...result,
    errors: result.errors.length > 0 ? result.errors : "none",
  });
  logger.info("========================================");

  return result;
}
