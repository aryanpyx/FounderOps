/**
 * Google Calendar ingestion adapter.
 *
 * Fetches events around today (± 1 day) via the Composio
 * GOOGLECALENDAR_FIND_EVENT tool, deduplicates, and normalizes.
 */

import { db } from "../../../server/clients/db";
import { callTool } from "../../../server/clients/ai";
import type { RawEvent } from "../types";
import { logger } from "../types";

/** Shape we expect back from the Composio Calendar tool (adapt as needed) */
interface CalendarEventResponse {
  events?: Array<{
    id?: string;
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    organizer?: { email?: string; displayName?: string };
    attendees?: Array<{ email?: string; displayName?: string }>;
    htmlLink?: string;
    location?: string;
    status?: string;
  }>;
  [key: string]: unknown;
}

/**
 * Ingest Google Calendar events for the given instance.
 *
 * Fetches events from yesterday through tomorrow, skips already-processed
 * ones, and normalizes into RawEvents. Only events with meaningful
 * descriptions or notes are worth extracting.
 */
export async function ingestCalendar(instanceId: string): Promise<RawEvent[]> {
  logger.info("Calendar adapter: starting ingestion", { instanceId });

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const timeMin = new Date(now.getTime() - dayMs).toISOString();
  const timeMax = new Date(now.getTime() + dayMs).toISOString();

  const response = (await callTool(instanceId, "GOOGLECALENDAR_FIND_EVENT", {
    time_min: timeMin,
    time_max: timeMax,
    max_results: 50,
  })) as CalendarEventResponse;

  const calEvents = response?.events ?? [];

  if (calEvents.length === 0) {
    logger.info("Calendar adapter: no events found");
    return [];
  }

  const events: RawEvent[] = [];

  for (const evt of calEvents) {
    const eventId = evt.id;
    if (!eventId) continue;

    // Dedup
    const existing = await db.founderMemory.findFirst({
      where: { instanceId, messageId: eventId },
    });

    if (existing) continue;

    const title = evt.summary ?? "(untitled event)";
    const description = evt.description ?? "";
    const content = description
      ? `${title}\n\n${description}`
      : title;

    const startStr = evt.start?.dateTime ?? evt.start?.date;
    const occurredAt = startStr ? new Date(startStr) : now;

    const organizer = evt.organizer?.displayName ?? evt.organizer?.email ?? "Unknown";

    events.push({
      id: eventId,
      source: "Calendar",
      author: organizer,
      content,
      occurredAt,
      linkToSource: evt.htmlLink,
      rawContent: description || undefined,
      metadata: {
        eventTitle: title,
        location: evt.location,
        status: evt.status,
        attendees: evt.attendees?.map((a) => a.displayName ?? a.email),
      },
    });
  }

  logger.info(`Calendar adapter: ${events.length} new events from ${calEvents.length} calendar entries`);
  return events;
}
