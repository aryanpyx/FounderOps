import { MemoryItem } from '../types';

// Single source of real founder-memory data for all services.
// Hits the same-origin /api/founderops/memories endpoint (session cookie sent
// automatically). Returns [] on any error so the UI degrades gracefully.
export async function fetchMemories(): Promise<MemoryItem[]> {
  try {
    const res = await fetch('/api/founderops/memories', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: MemoryItem[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}
