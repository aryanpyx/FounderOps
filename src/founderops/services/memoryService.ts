import type { MemoryItem, MemoryType } from '../types';
import { fetchMemories } from './_data';

type GraphNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, unknown>;
};

const COL_X: Record<MemoryType, number> = {
  Blocker: 50,
  Decision: 430,
  Metric: 810,
  Commitment: 1190,
};

export const memoryService = {
  getMemories: async (): Promise<MemoryItem[]> => fetchMemories(),

  searchMemories: async (
    query: string,
    types: MemoryType[],
    sources?: string[]
  ): Promise<MemoryItem[]> => {
    let results = await fetchMemories();

    if (query.trim() !== '') {
      const q = query.toLowerCase();
      results = results.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.provenance.author.toLowerCase().includes(q) ||
          (m.provenance.raw_content &&
            m.provenance.raw_content.toLowerCase().includes(q))
      );
    }
    if (types.length > 0) {
      results = results.filter((m) => types.includes(m.type));
    }
    if (sources && sources.length > 0) {
      results = results.filter((m) => sources.includes(m.provenance.source));
    }
    return results;
  },

  getMemoryById: async (
    id: string
  ): Promise<{ item: MemoryItem | null; relatedItems: MemoryItem[] }> => {
    const all = await fetchMemories();
    const item = all.find((m) => m.id === id) ?? null;
    if (!item) return { item: null, relatedItems: [] };

    const relatedIds = new Set<string>(item.relatedMemoryIds ?? []);
    item.decisionDetails?.blockerIds?.forEach((x) => relatedIds.add(x));
    item.decisionDetails?.metricIds?.forEach((x) => relatedIds.add(x));
    if (item.commitmentDetails?.decisionId)
      relatedIds.add(item.commitmentDetails.decisionId);

    all.forEach((m) => {
      if (
        m.decisionDetails?.blockerIds?.includes(id) ||
        m.decisionDetails?.metricIds?.includes(id) ||
        m.commitmentDetails?.decisionId === id ||
        m.relatedMemoryIds?.includes(id)
      ) {
        relatedIds.add(m.id);
      }
    });

    return { item, relatedItems: all.filter((m) => relatedIds.has(m.id)) };
  },

  getMemoryGraph: async (): Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }> => {
    const all = await fetchMemories();
    const idSet = new Set(all.map((m) => m.id));
    const perTypeIndex: Record<string, number> = {};
    const nodes: GraphNode[] = [];

    for (const m of all) {
      const i = perTypeIndex[m.type] ?? 0;
      perTypeIndex[m.type] = i + 1;
      nodes.push({
        id: m.id,
        type: 'memoryNode',
        position: { x: COL_X[m.type] ?? 430, y: 80 + i * 150 },
        data: {
          id: m.id,
          type: m.type,
          title: m.title,
          source: m.provenance.source,
          timestamp: m.timestamp,
          status:
            m.blockerDetails?.status ??
            m.commitmentDetails?.status ??
            'Active',
        },
      });
    }

    const edges: GraphEdge[] = [];
    for (const m of all) {
      if (m.type === 'Decision' && m.decisionDetails) {
        m.decisionDetails.blockerIds?.forEach((bId) => {
          if (idSet.has(bId))
            edges.push({
              id: `e-${bId}-${m.id}`,
              source: bId,
              target: m.id,
              animated: true,
              style: { stroke: '#fb7185', strokeWidth: 2 },
            });
        });
        m.decisionDetails.metricIds?.forEach((mId) => {
          if (idSet.has(mId))
            edges.push({
              id: `e-${m.id}-${mId}`,
              source: m.id,
              target: mId,
              animated: true,
              style: { stroke: '#fbbf24', strokeWidth: 2 },
            });
        });
      }
      if (
        m.type === 'Commitment' &&
        m.commitmentDetails?.decisionId &&
        idSet.has(m.commitmentDetails.decisionId)
      ) {
        edges.push({
          id: `e-${m.commitmentDetails.decisionId}-${m.id}`,
          source: m.commitmentDetails.decisionId,
          target: m.id,
          animated: true,
          style: { stroke: '#34d399', strokeWidth: 2 },
        });
      }
      m.relatedMemoryIds?.forEach((rid) => {
        if (idSet.has(rid))
          edges.push({
            id: `e-rel-${m.id}-${rid}`,
            source: m.id,
            target: rid,
            style: { stroke: '#3f3f46', strokeWidth: 1 },
          });
      });
    }

    return { nodes, edges };
  },
};
