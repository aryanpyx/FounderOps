'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { memoryService } from '@/services/memoryService';
import { computeNudges, type Nudge } from '@/lib/nudges';

const STYLE: Record<Nudge['kind'], { icon: React.ElementType; ring: string; text: string }> = {
  overdue: { icon: AlertTriangle, ring: 'border-rose-500/25 bg-rose-500/[0.06]', text: 'text-rose-300' },
  'due-soon': { icon: Clock, ring: 'border-amber-500/25 bg-amber-500/[0.06]', text: 'text-amber-300' },
  'stale-blocker': { icon: AlertTriangle, ring: 'border-rose-500/25 bg-rose-500/[0.06]', text: 'text-rose-300' },
};

export function NudgesCard({ onOpen }: { onOpen?: (id: string) => void }) {
  const [nudges, setNudges] = useState<Nudge[] | null>(null);

  useEffect(() => {
    memoryService
      .getMemories()
      .then((m) => setNudges(computeNudges(m)))
      .catch(() => setNudges([]));
  }, []);

  if (nudges === null) return null; // still loading — stay quiet

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.05] p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <Zap className="h-4 w-4 text-indigo-400" /> Proactive Nudges
          {nudges.length > 0 && (
            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              {nudges.length}
            </span>
          )}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Your AI chief of staff
        </span>
      </div>

      {nudges.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> All clear — no overdue commitments or lingering blockers.
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {nudges.map((n) => {
            const s = STYLE[n.kind];
            const Icon = s.icon;
            return (
              <div
                key={n.id}
                onClick={() => onOpen?.(n.memoryId)}
                className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors ${s.ring} ${onOpen ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.text}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{n.title}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{n.detail}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-zinc-200 transition-colors hover:bg-white/10"
                >
                  Follow up <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
