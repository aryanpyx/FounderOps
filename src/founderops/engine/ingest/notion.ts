/**
 * Notion ingestion adapter.
 *
 * Fetches recently updated pages via the Composio NOTION_SEARCH_PAGES tool,
 * deduplicates against existing records, and normalizes into RawEvents.
 */

import { db } from "../../../server/clients/db";
import { callTool } from "../../../server/clients/ai";
import type { RawEvent } from "../types";
import { logger } from "../types";

/** Shape we expect back from the Composio Notion tool (adapt as needed) */
interface NotionSearchResponse {
  results?: Array<{
    id?: string;
    url?: string;
    last_edited_time?: string;
    last_edited_by?: {
      name?: string;
      id?: string;
    };
    properties?: {
      title?: {
        title?: Array<{ plain_text?: string }>;
      };
      Name?: {
        title?: Array<{ plain_text?: string }>;
      };
      [key: string]: unknown;
    };
    content?: string;
    plain_text?: string;
  }>;
  [key: string]: unknown;
}

/** How far back to look for updated pages (24 hours) */
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

/** Max content preview length */
const CONTENT_PREVIEW_LENGTH = 500;

/**
 * Ingest recently updated Notion pages for the given instance.
 *
 * 1. Calls NOTION_SEARCH_PAGES with a recency filter
 * 2. Extracts title + content preview from each page
 * 3. Deduplicates and returns normalized RawEvent array
 */
export async function ingestNotion(instanceId: string): Promise<RawEvent[]> {
  logger.info("Notion adapter: starting ingestion", { instanceId });

  const since = new Date(Date.now() - LOOKBACK_MS).toISOString();

  const response = (await callTool(instanceId, "NOTION_SEARCH_PAGES", {
    filter: { timestamp: "last_edited_time", last_edited_time: { after: since } },
    sort: { direction: "descending", timestamp: "last_edited_time" },
    page_size: 20,
  })) as NotionSearchResponse;

  const pages = response?.results ?? [];

  if (pages.length === 0) {
    logger.info("Notion adapter: no updated pages found");
    return [];
  }

  const events: RawEvent[] = [];

  for (const page of pages) {
    const pageId = page.id;
    if (!pageId) continue;

    // Dedup
    const existing = await db.founderMemory.findFirst({
      where: { instanceId, messageId: pageId },
    });

    if (existing) continue;

    const title = extractNotionTitle(page);
    const content = page.content ?? page.plain_text ?? "";
    const preview = content.length > CONTENT_PREVIEW_LENGTH
      ? content.slice(0, CONTENT_PREVIEW_LENGTH)
      : content;

    const author = page.last_edited_by?.name ?? page.last_edited_by?.id ?? "Unknown";
    const occurredAt = page.last_edited_time ? new Date(page.last_edited_time) : new Date();

    events.push({
      id: pageId,
      source: "Notion",
      author,
      content: title ? `${title}\n\n${preview}`.trim() : preview || "(empty page)",
      occurredAt,
      linkToSource: page.url,
      rawContent: content || undefined,
      metadata: {
        pageTitle: title,
      },
    });
  }

  logger.info(`Notion adapter: ${events.length} new events from ${pages.length} pages`);
  return events;
}

/** Single page item from the Notion search response */
type NotionPage = NonNullable<NotionSearchResponse["results"]>[number];

/** Extract the title from a Notion page's property structure */
function extractNotionTitle(page: NotionPage): string {
  // Notion stores titles in different property keys depending on the database
  const titleProp = page.properties?.title ?? page.properties?.Name;
  const titleBlocks = titleProp?.title;

  if (Array.isArray(titleBlocks) && titleBlocks.length > 0) {
    return titleBlocks.map((block) => block.plain_text ?? "").join("");
  }

  return "(untitled)";
}

