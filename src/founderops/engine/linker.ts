/**
 * Record Linker — Module 4
 *
 * Builds graph edges between related FounderMemory records by updating
 * the `relatedIds` field and type-specific link fields in `details`.
 *
 * Linking strategies:
 * 1. Blocker → Decision (semantic similarity)
 * 2. Metric → Decision (semantic similarity + temporal proximity)
 * 3. Commitment → Decision/Blocker (keyword match)
 * 4. Temporal clustering (same source + same day + keyword overlap)
 *
 * NOTE: Strategies 1–2 require pgvector for cosine similarity.
 * They are stubbed with TODO comments until pgvector is available.
 * Strategy 4 (temporal clustering) works without pgvector.
 */

import { db } from "../../server/clients/db";
import type { FounderMemoryRecord } from "../../server/clients/db";
import { logger } from "./types";

/* ------------------------------------------------------------------ */
/*  Main Linking Function                                              */
/* ------------------------------------------------------------------ */

/**
 * Link related records for the given instance.
 *
 * This should run AFTER extraction. It looks at recently created records
 * and finds connections to build the memory graph.
 *
 * Returns the count of links created.
 */
export async function linkRecords(instanceId: string): Promise<number> {
  logger.info("Record linker: starting", { instanceId });

  let totalLinks = 0;

  // --- Strategy 1 & 2: Semantic similarity linking ---
  // TODO: Implement when pgvector is enabled on the database.
  //
  // These strategies use cosine similarity between record embeddings
  // to find related records. The pseudo-code:
  //
  // Strategy 1: Blocker → Decision
  //   For each new Decision, find Blockers with embedding similarity > 0.75
  //   → Add Blocker ID to Decision's relatedIds and details.blockerIds
  //   → Add Decision ID to Blocker's relatedIds
  //
  // Strategy 2: Metric → Decision
  //   For each new Metric, find Decisions within 7 days with similarity > 0.7
  //   → Add Metric ID to Decision's relatedIds and details.metricIds
  //   → Add Decision ID to Metric's relatedIds
  //
  // Implementation requires:
  // 1. pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
  // 2. An embedding column on FounderMemory
  // 3. Raw queries like:
  //    SELECT id FROM "FounderMemory"
  //    WHERE instance_id = ${instanceId}
  //      AND type = 'Blocker'
  //      AND embedding <=> ${embedding} < 0.25
  //    ORDER BY embedding <=> ${embedding}
  //    LIMIT 5
  //
  logger.info("Record linker: semantic linking skipped (pgvector not configured)");

  // --- Strategy 3: Commitment → Decision/Blocker keyword matching ---
  try {
    const commitmentLinks = await linkCommitmentsToSources(instanceId);
    totalLinks += commitmentLinks;
  } catch (error) {
    logger.error("Record linker: commitment linking failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // --- Strategy 4: Temporal clustering ---
  try {
    const temporalLinks = await linkTemporalClusters(instanceId);
    totalLinks += temporalLinks;
  } catch (error) {
    logger.error("Record linker: temporal clustering failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info(`Record linker: complete — ${totalLinks} links created`);
  return totalLinks;
}

/* ------------------------------------------------------------------ */
/*  Strategy 3: Commitment → Decision/Blocker Keyword Matching         */
/* ------------------------------------------------------------------ */

/**
 * For each recent Commitment, search for Decisions or Blockers
 * that share significant keywords with the commitment's task description.
 */
async function linkCommitmentsToSources(instanceId: string): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get recent commitments
  const commitments = await db.founderMemory.findMany({
    where: {
      instanceId,
      type: "Commitment",
      occurredAt: { gte: oneDayAgo },
    },
  });

  if (commitments.length === 0) return 0;

  // Get all decisions and blockers from the last 30 days to match against
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const targets = await db.founderMemory.findMany({
    where: {
      instanceId,
      type: { in: ["Decision", "Blocker"] },
      occurredAt: { gte: thirtyDaysAgo },
    },
  });

  if (targets.length === 0) return 0;

  let linkCount = 0;

  for (const commitment of commitments) {
    const commitmentKeywords = extractKeywords(commitment.content + " " + commitment.title);

    for (const target of targets) {
      // Skip if already linked
      if (commitment.relatedIds.includes(target.id)) continue;

      const targetKeywords = extractKeywords(target.content + " " + target.title);
      const overlap = keywordOverlap(commitmentKeywords, targetKeywords);

      if (overlap >= 2) {
        // Link bidirectionally
        await addBidirectionalLink(commitment, target);
        linkCount++;
      }
    }
  }

  return linkCount;
}

/* ------------------------------------------------------------------ */
/*  Strategy 4: Temporal Clustering                                    */
/* ------------------------------------------------------------------ */

/**
 * Records from the same source + same day with overlapping keywords
 * are likely related. Group and link them.
 */
async function linkTemporalClusters(instanceId: string): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentRecords = await db.founderMemory.findMany({
    where: {
      instanceId,
      occurredAt: { gte: oneDayAgo },
    },
  });

  if (recentRecords.length < 2) return 0;

  // Group by source + date
  const groups = new Map<string, FounderMemoryRecord[]>();

  for (const record of recentRecords) {
    const dateKey = record.occurredAt.toISOString().slice(0, 10);
    const groupKey = `${record.source}:${dateKey}`;

    const group = groups.get(groupKey);
    if (group) {
      group.push(record);
    } else {
      groups.set(groupKey, [record]);
    }
  }

  let linkCount = 0;

  // Within each group, find pairs with keyword overlap
  for (const records of groups.values()) {
    if (records.length < 2) continue;

    for (let i = 0; i < records.length; i++) {
      const recordA = records[i]!;
      const keywordsA = extractKeywords(recordA.content + " " + recordA.title);

      for (let j = i + 1; j < records.length; j++) {
        const recordB = records[j]!;

        // Skip if already linked
        if (recordA.relatedIds.includes(recordB.id)) continue;

        const keywordsB = extractKeywords(recordB.content + " " + recordB.title);
        const overlap = keywordOverlap(keywordsA, keywordsB);

        if (overlap >= 2) {
          await addBidirectionalLink(recordA, recordB);
          linkCount++;
        }
      }
    }
  }

  return linkCount;
}

/* ------------------------------------------------------------------ */
/*  Shared Utilities                                                   */
/* ------------------------------------------------------------------ */

/** Stop words to exclude from keyword extraction */
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "about", "between",
  "through", "during", "before", "after", "above", "below", "up", "down",
  "out", "off", "over", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "each", "every",
  "both", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "but", "and", "or", "if", "this", "that", "these", "those", "it",
  "its", "i", "we", "he", "she", "they", "me", "him", "her", "us",
  "my", "your", "his", "our", "their",
]);

/** Extract meaningful keywords from text */
function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const keywords = new Set<string>();

  for (const word of words) {
    if (word.length >= 3 && !STOP_WORDS.has(word)) {
      keywords.add(word);
    }
  }

  return keywords;
}

/** Count overlapping keywords between two sets */
function keywordOverlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const word of a) {
    if (b.has(word)) count++;
  }
  return count;
}

/** Add a bidirectional link between two records */
async function addBidirectionalLink(
  recordA: FounderMemoryRecord,
  recordB: FounderMemoryRecord
): Promise<void> {
  // Add B's ID to A's relatedIds
  if (!recordA.relatedIds.includes(recordB.id)) {
    const newRelatedA = [...recordA.relatedIds, recordB.id];
    await db.founderMemory.update({
      where: { id: recordA.id },
      data: { relatedIds: newRelatedA },
    });
    recordA.relatedIds = newRelatedA; // update local copy
  }

  // Add A's ID to B's relatedIds
  if (!recordB.relatedIds.includes(recordA.id)) {
    const newRelatedB = [...recordB.relatedIds, recordA.id];
    await db.founderMemory.update({
      where: { id: recordB.id },
      data: { relatedIds: newRelatedB },
    });
    recordB.relatedIds = newRelatedB; // update local copy
  }
}
