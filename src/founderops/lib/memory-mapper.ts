import type { FounderMemory } from "~/generated/prisma/client";
import type { MemoryItem, Provenance, SourceSystem } from "~/founderops/types";

// Converts a DB FounderMemory row into the frontend MemoryItem contract.
// Type-specific fields live in `details` (Json) and are attached to the matching
// *Details key, with id + provenance merged back in.
export function toMemoryItem(m: FounderMemory): MemoryItem {
  const provenance: Provenance = {
    source: m.source as SourceSystem,
    author: m.author,
    timestamp: m.occurredAt.toISOString(),
    message_id: m.messageId ?? "",
    link_to_source: m.linkToSource ?? "",
    raw_content: m.rawContent ?? undefined,
  };

  const details =
    m.details && typeof m.details === "object" && !Array.isArray(m.details)
      ? (m.details as Record<string, unknown>)
      : {};

  const item: MemoryItem = {
    id: m.id,
    type: m.type,
    title: m.title,
    content: m.content,
    timestamp: m.occurredAt.toISOString(),
    provenance,
    relatedMemoryIds: m.relatedIds,
  };

  const typed = { id: m.id, ...details, provenance };
  switch (m.type) {
    case "Decision":
      item.decisionDetails = typed as unknown as MemoryItem["decisionDetails"];
      break;
    case "Commitment":
      item.commitmentDetails =
        typed as unknown as MemoryItem["commitmentDetails"];
      break;
    case "Blocker":
      item.blockerDetails = typed as unknown as MemoryItem["blockerDetails"];
      break;
    case "Metric":
      item.metricDetails = typed as unknown as MemoryItem["metricDetails"];
      break;
  }

  return item;
}
