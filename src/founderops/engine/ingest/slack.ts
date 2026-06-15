/**
 * Slack ingestion adapter.
 *
 * Fetches recent messages via the Composio SLACK_LIST_MESSAGES tool,
 * deduplicates against existing records, and normalizes into RawEvents.
 */

import { db } from "../../../server/clients/db";
import { callTool } from "../../../server/clients/ai";
import type { RawEvent } from "../types";
import { logger } from "../types";

/** Shape we expect back from the Composio Slack tool (adapt as needed) */
interface SlackMessageResponse {
  messages?: Array<{
    ts?: string;
    client_msg_id?: string;
    user?: string;
    username?: string;
    text?: string;
    channel?: string;
    channel_name?: string;
    thread_ts?: string;
    type?: string;
    subtype?: string;
  }>;
  [key: string]: unknown;
}

/** How far back to fetch messages (24 hours) */
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

/**
 * Ingest recent Slack messages for the given instance.
 *
 * 1. Calls SLACK_LIST_MESSAGES to fetch messages from last 24h
 * 2. Filters out bot/system messages and deduplicates
 * 3. Returns normalized RawEvent array
 */
export async function ingestSlack(instanceId: string): Promise<RawEvent[]> {
  logger.info("Slack adapter: starting ingestion", { instanceId });

  const oldest = new Date(Date.now() - LOOKBACK_MS);
  const oldestUnix = Math.floor(oldest.getTime() / 1000).toString();

  const response = (await callTool(instanceId, "SLACK_LIST_MESSAGES", {
    oldest: oldestUnix,
    limit: 100,
  })) as SlackMessageResponse;

  const messages = response?.messages ?? [];

  if (messages.length === 0) {
    logger.info("Slack adapter: no messages returned");
    return [];
  }

  const events: RawEvent[] = [];

  for (const msg of messages) {
    // Skip bot/system messages
    if (msg.subtype === "bot_message" || msg.subtype === "channel_join" || msg.subtype === "channel_leave") {
      continue;
    }

    const messageId = msg.client_msg_id ?? msg.ts;
    if (!messageId) continue;

    const text = msg.text;
    if (!text || text.trim().length === 0) continue;

    // Dedup
    const existing = await db.founderMemory.findFirst({
      where: { instanceId, messageId },
    });

    if (existing) continue;

    const occurredAt = msg.ts ? new Date(parseFloat(msg.ts) * 1000) : new Date();

    events.push({
      id: messageId,
      source: "Slack",
      author: msg.username ?? msg.user ?? "Unknown",
      content: text,
      occurredAt,
      rawContent: text,
      metadata: {
        channel: msg.channel_name ?? msg.channel,
        threadTs: msg.thread_ts,
      },
    });
  }

  logger.info(`Slack adapter: ${events.length} new events from ${messages.length} messages`);
  return events;
}
