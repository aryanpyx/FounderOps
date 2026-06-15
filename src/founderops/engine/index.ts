/**
 * Engine Index — re-exports all public APIs
 *
 * Single import point for the rest of the codebase:
 *   import { runIngestionCycle, generateDailyBrief, ... } from "./founderops/engine"
 */

// Core types
export type {
  RawEvent,
  ExtractedRecord,
  ExtractedDecision,
  ExtractedCommitment,
  ExtractedBlocker,
  ExtractedMetric,
  SourceName,
  MemoryType,
  IngestionResult,
  SourceAdapter,
  AdapterRegistration,
  MemoryDetails,
  DecisionDetails,
  CommitmentDetails,
  BlockerDetails,
  MetricDetails,
  EngineLogger,
} from "./types";

export { logger } from "./types";

// Module 1: Ingestion
export { ingestAll, getRegisteredSources, isSourceEnabled } from "./ingest/index";
export { ingestGmail } from "./ingest/gmail";
export { ingestSlack } from "./ingest/slack";
export { ingestNotion } from "./ingest/notion";
export { ingestCalendar } from "./ingest/calendar";
export { ingestStripe } from "./ingest/stripe";

// Module 2: Signal Filter
export { filterSignals } from "./signal-filter";

// Module 3: Extractor
export { extractFromEvent } from "./extractor";

// Module 4: Linker
export { linkRecords } from "./linker";

// Module 5: Prompt Engine
export { generateDailyBrief } from "./prompts/daily-brief";
export { generateWeeklyReview } from "./prompts/weekly-review";
export { recoverDecision } from "./prompts/decision-recovery";

// Module 6: Orchestrator
export { runIngestionCycle } from "./orchestrator";

// Module 8: Scheduler
export {
  DAILY_BRIEF_CRON,
  HOURLY_INGEST_CRON,
  WEEKLY_REVIEW_CRON,
  ENGINE_SCHEDULES,
} from "./scheduler";
export type { ScheduleEntry } from "./scheduler";
