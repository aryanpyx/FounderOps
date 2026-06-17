import type { MemoryItem } from '../types';

/**
 * Proactive nudges — the "Chief of Staff" layer. Scans typed memory for things
 * that need the founder's attention: overdue commitments, commitments due soon
 * with no logged progress, and high-severity blockers that have lingered.
 */
export type Nudge = {
  id: string;
  severity: 'high' | 'medium';
  kind: 'overdue' | 'due-soon' | 'stale-blocker';
  title: string;
  detail: string;
  memoryId: string;
};

const DAY = 24 * 60 * 60 * 1000;

function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function computeNudges(memories: MemoryItem[], now: number = Date.now()): Nudge[] {
  const nudges: Nudge[] = [];

  for (const m of memories) {
    // Commitments: overdue or due-soon while still open.
    if (m.type === 'Commitment' && m.commitmentDetails?.status === 'Open') {
      const task = m.commitmentDetails.task ?? m.title;
      const owner = m.commitmentDetails.owner ?? 'Someone';
      const dl = m.commitmentDetails.deadline ? new Date(m.commitmentDetails.deadline).getTime() : NaN;
      if (!Number.isNaN(dl)) {
        if (dl < now) {
          nudges.push({
            id: `nudge-${m.id}`,
            severity: 'high',
            kind: 'overdue',
            memoryId: m.id,
            title: `Overdue · ${task}`,
            detail: `${owner} committed by ${fmtDate(dl)} — still open, nothing logged against it.`,
          });
        } else if (dl < now + 2 * DAY) {
          nudges.push({
            id: `nudge-${m.id}`,
            severity: 'medium',
            kind: 'due-soon',
            memoryId: m.id,
            title: `Due soon · ${task}`,
            detail: `Due ${fmtDate(dl)} (${owner}) — no progress logged yet.`,
          });
        }
      }
    }

    // High-severity blockers that have stayed open for a while.
    if (m.type === 'Blocker' && m.blockerDetails?.status === 'Open' && m.blockerDetails?.severity === 'High') {
      const ageDays = Math.floor((now - new Date(m.timestamp).getTime()) / DAY);
      if (ageDays >= 3) {
        nudges.push({
          id: `nudge-${m.id}`,
          severity: 'high',
          kind: 'stale-blocker',
          memoryId: m.id,
          title: `Blocker lingering · ${m.title}`,
          detail: `High-severity blocker open for ${ageDays} days. Still unresolved.`,
        });
      }
    }
  }

  // High severity first, then cap.
  return nudges
    .sort((a, b) => (a.severity === 'high' ? 0 : 1) - (b.severity === 'high' ? 0 : 1))
    .slice(0, 6);
}
