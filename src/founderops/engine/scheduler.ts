/**
 * Scheduler Constants — Module 8
 *
 * Cron expressions and schedule configuration for the intelligence engine.
 * These are exported as constants. The TrustClaw scheduler config will
 * import and register them, pointing each to the corresponding API route.
 *
 * All times are in UTC. IST = UTC + 5:30
 */

/* ------------------------------------------------------------------ */
/*  Cron Expressions                                                   */
/* ------------------------------------------------------------------ */

/**
 * 8:00 AM IST daily → run ingestion + generate brief
 * IST 08:00 = UTC 02:30
 */
export const DAILY_BRIEF_CRON = "30 2 * * *";

/**
 * Every hour → run ingestion cycle
 * Keeps the memory fresh throughout the day
 */
export const HOURLY_INGEST_CRON = "0 * * * *";

/**
 * Friday 5:00 PM IST → generate weekly review
 * IST 17:00 = UTC 11:30
 */
export const WEEKLY_REVIEW_CRON = "30 11 * * 5";

/* ------------------------------------------------------------------ */
/*  Schedule Configuration                                             */
/* ------------------------------------------------------------------ */

export interface ScheduleEntry {
  /** Human-readable name for this scheduled job */
  name: string;
  /** Cron expression (5-field, UTC) */
  cron: string;
  /** API route to call when triggered */
  endpoint: string;
  /** HTTP method */
  method: "POST" | "GET";
  /** Whether this schedule is enabled by default */
  enabled: boolean;
  /** Description of what this job does */
  description: string;
}

/**
 * All scheduled jobs for the intelligence engine.
 * Import this in the TrustClaw scheduler config to register them.
 */
export const ENGINE_SCHEDULES: ScheduleEntry[] = [
  {
    name: "hourly-ingest",
    cron: HOURLY_INGEST_CRON,
    endpoint: "/api/founderops/engine/ingest",
    method: "POST",
    enabled: true,
    description: "Run full ingestion cycle every hour",
  },
  {
    name: "daily-brief",
    cron: DAILY_BRIEF_CRON,
    endpoint: "/api/founderops/engine/brief",
    method: "POST",
    enabled: true,
    description: "Generate morning brief at 8AM IST",
  },
  {
    name: "weekly-review",
    cron: WEEKLY_REVIEW_CRON,
    endpoint: "/api/founderops/engine/weekly",
    method: "POST",
    enabled: true,
    description: "Generate weekly review Friday 5PM IST",
  },
];
