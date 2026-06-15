/**
 * Shared types for the Founder Intelligence Engine.
 *
 * These define the contracts between modules. They are intentionally
 * extensible — new sources, memory types, and detail shapes can be added
 * without breaking existing code.
 */

/* ------------------------------------------------------------------ */
/*  Source & Memory Type Unions                                        */
/* ------------------------------------------------------------------ */

/** All supported ingestion sources. Add new sources here. */
export type SourceName =
  | "Gmail"
  | "Slack"
  | "Notion"
  | "Calendar"
  | "Stripe"
  | "Linear"
  | "chat";

/** All supported memory record types. */
export type MemoryType = "Decision" | "Commitment" | "Blocker" | "Metric";

/* ------------------------------------------------------------------ */
/*  Raw Event (output of ingestion adapters)                          */
/* ------------------------------------------------------------------ */

/**
 * A normalized event from any ingestion source.
 * Every adapter must convert its source-specific data into this shape.
 */
export interface RawEvent {
  /** Unique identifier from the source system (message ID, event ID, etc.) */
  id: string;
  /** Which tool/service produced this event */
  source: SourceName;
  /** Who created or triggered this event */
  author: string;
  /** The text content to be classified/extracted */
  content: string;
  /** When the event originally occurred */
  occurredAt: Date;
  /** URL or deep link back to the source */
  linkToSource?: string;
  /** Original unprocessed content (if different from content) */
  rawContent?: string;
  /** Source-specific metadata (attachments, thread IDs, labels, etc.) */
  metadata?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Detail Payloads (type-specific structured data)                   */
/* ------------------------------------------------------------------ */

export interface DecisionDetails {
  decision: string;
  reason: string;
  date: string;
  blockerIds?: string[];
  metricIds?: string[];
  [key: string]: unknown; // extensible
}

export interface CommitmentDetails {
  owner: string;
  task: string;
  deadline: string;
  status: "Open" | "Fulfilled" | "Overdue";
  [key: string]: unknown;
}

export interface BlockerDetails {
  issue: string;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "Resolved";
  [key: string]: unknown;
}

export interface MetricDetails {
  name: string;
  old_value: number;
  new_value: number;
  change: string;
  [key: string]: unknown;
}

/** Discriminated union of all detail payload types */
export type MemoryDetails =
  | (DecisionDetails & { _type: "Decision" })
  | (CommitmentDetails & { _type: "Commitment" })
  | (BlockerDetails & { _type: "Blocker" })
  | (MetricDetails & { _type: "Metric" });

/* ------------------------------------------------------------------ */
/*  Extracted Record (output of the extraction engine)                */
/* ------------------------------------------------------------------ */

interface BaseExtractedFields {
  title: string;
  content: string;
}

export interface ExtractedDecision extends BaseExtractedFields {
  type: "Decision";
  decision: string;
  reason: string;
  date: string;
}

export interface ExtractedCommitment extends BaseExtractedFields {
  type: "Commitment";
  owner: string;
  task: string;
  deadline: string;
  status: "Open";
}

export interface ExtractedBlocker extends BaseExtractedFields {
  type: "Blocker";
  issue: string;
  severity: "High" | "Medium" | "Low";
  status: "Open";
}

export interface ExtractedMetric extends BaseExtractedFields {
  type: "Metric";
  name: string;
  old_value: number;
  new_value: number;
  change: string;
}

/** Discriminated union of all extracted record shapes */
export type ExtractedRecord =
  | ExtractedDecision
  | ExtractedCommitment
  | ExtractedBlocker
  | ExtractedMetric;

/* ------------------------------------------------------------------ */
/*  Ingestion Result (orchestrator output)                            */
/* ------------------------------------------------------------------ */

export interface IngestionResult {
  /** Total raw events fetched from all sources */
  ingested: number;
  /** Events that passed the signal filter */
  filtered: number;
  /** Memory records created in the database */
  extracted: number;
  /** Records that were linked to other records */
  linked: number;
  /** Non-fatal errors collected during the cycle */
  errors: string[];
  /** Per-source breakdown */
  sourceBreakdown: Record<string, { fetched: number; errors: number }>;
  /** How long the full cycle took in ms */
  durationMs: number;
}

/* ------------------------------------------------------------------ */
/*  Source Adapter Interface                                           */
/* ------------------------------------------------------------------ */

/**
 * A source adapter fetches raw events from one integration.
 * Implement this interface to add a new source to the engine.
 */
export type SourceAdapter = (instanceId: string) => Promise<RawEvent[]>;

/**
 * Registry entry for a source adapter.
 * Adapters are registered in a map so adding a new source is one entry.
 */
export interface AdapterRegistration {
  name: SourceName;
  adapter: SourceAdapter;
  /** Whether this adapter is enabled (can be toggled per-instance) */
  enabled: boolean;
}

/* ------------------------------------------------------------------ */
/*  Logger                                                             */
/* ------------------------------------------------------------------ */

export interface EngineLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Default console logger. Replace with a structured logger (pino, winston)
 * when integrating into the main codebase.
 */
export const logger: EngineLogger = {
  info: (msg, meta) => console.log(`[ENGINE] ${msg}`, meta ?? ""),
  warn: (msg, meta) => console.warn(`[ENGINE ⚠] ${msg}`, meta ?? ""),
  error: (msg, meta) => console.error(`[ENGINE ✗] ${msg}`, meta ?? ""),
};
