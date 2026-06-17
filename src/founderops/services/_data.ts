import type { MemoryItem } from '../types';
import { MOCK_MEMORIES } from '../mock-data/memories';

const DEMO_KEY = 'founderops-demo';

/** Demo mode: serve the rich sample dataset so a new user (or a judge) sees a
 *  fully-populated cockpit, graph and brief instantly — without connecting tools. */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDemoMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(DEMO_KEY, '1');
    else localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
}

// Single source of founder-memory data for all services. In demo mode returns the
// sample dataset; otherwise hits same-origin /api/founderops/memories. Returns []
// on any error so the UI degrades gracefully.
export async function fetchMemories(): Promise<MemoryItem[]> {
  if (isDemoMode()) return MOCK_MEMORIES;
  try {
    const res = await fetch('/api/founderops/memories', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: MemoryItem[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}
