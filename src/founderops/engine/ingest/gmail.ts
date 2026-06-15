/**
 * Gmail ingestion adapter.
 *
 * Fetches recent emails via the Composio GMAIL_FETCH_EMAILS tool,
 * deduplicates against existing records, and normalizes into RawEvents.
 */

import { db } from "../../../server/clients/db";
import { callTool } from "../../../server/clients/ai";
import type { RawEvent } from "../types";
import { logger } from "../types";

/** A single email, tolerant of the various field names Composio returns. */
interface GmailEmail {
  id?: string;
  messageId?: string;
  from?: string;
  sender?: string;
  subject?: string;
  snippet?: string;
  preview?: { body?: string; subject?: string };
  messageText?: string;
  body?: string;
  date?: string;
  messageTimestamp?: string;
  internalDate?: string;
  labelIds?: string[];
  threadId?: string;
}

/**
 * Composio's GMAIL_FETCH_EMAILS response varies by SDK/provider version — the
 * email array can live under `emails`, `messages`, `data.messages`, or
 * `data.emails`. This normalizer finds it wherever it is so the adapter works
 * without depending on one exact shape.
 */
type GmailEmailResponse = Record<string, unknown>;

function normalizeGmail(response: GmailEmailResponse): GmailEmail[] {
  const data = (response?.data ?? response) as Record<string, unknown>;
  const candidates = [
    (response as { emails?: unknown }).emails,
    (response as { messages?: unknown }).messages,
    data?.messages,
    data?.emails,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as GmailEmail[];
  }
  return [];
}

/** Max emails to fetch per ingestion cycle */
const FETCH_LIMIT = 20;

/**
 * Ingest recent Gmail emails for the given instance.
 *
 * 1. Calls GMAIL_FETCH_EMAILS to fetch latest emails
 * 2. Checks each against the DB to skip already-processed messages
 * 3. Returns normalized RawEvent array
 */
export async function ingestGmail(instanceId: string): Promise<RawEvent[]> {
  logger.info("Gmail adapter: starting ingestion", { instanceId });

  const response = (await callTool(instanceId, "GMAIL_FETCH_EMAILS", {
    max_results: FETCH_LIMIT,
    label_ids: ["INBOX"],
    include_payload: false,
  })) as GmailEmailResponse;

  const emails = normalizeGmail(response);

  if (emails.length === 0) {
    logger.info("Gmail adapter: no emails returned");
    return [];
  }

  const events: RawEvent[] = [];

  for (const email of emails) {
    const messageId = email.messageId ?? email.id;
    if (!messageId) continue;

    // Dedup: skip if we've already ingested this message
    const existing = await db.founderMemory.findFirst({
      where: { instanceId, messageId },
    });

    if (existing) {
      continue;
    }

    const author = email.from ?? email.sender ?? "Unknown";
    const subject = email.subject ?? email.preview?.subject ?? "(no subject)";
    const body =
      email.body ?? email.messageText ?? email.preview?.body ?? email.snippet ?? "";
    const contentPreview = body.length > 1000 ? body.slice(0, 1000) : body;

    const occurredAt = parseDate(
      email.date ?? email.messageTimestamp ?? email.internalDate,
    );

    events.push({
      id: messageId,
      source: "Gmail",
      author,
      content: `${subject}\n\n${contentPreview}`.trim(),
      occurredAt,
      linkToSource: `https://mail.google.com/mail/#inbox/${email.threadId ?? messageId}`,
      rawContent: body,
      metadata: {
        subject,
        labels: email.labelIds,
        threadId: email.threadId,
      },
    });
  }

  logger.info(`Gmail adapter: ${events.length} new events from ${emails.length} emails`);
  return events;
}

/** Parse a date string with fallback to current time */
function parseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
