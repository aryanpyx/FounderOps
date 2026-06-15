'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  Mail,
  FolderKanban,
  FileText,
  CalendarDays,
  TrendingUp,
  AlertOctagon,
  CheckSquare,
  Zap,
  RefreshCw,
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { memoryService } from '@/services/memoryService';
import type { MemoryItem, SourceSystem } from '@/types';
import MemoryDetailPanel from '@/components/MemoryDetailPanel';
import { BriefMarkdown } from '@/components/BriefMarkdown';

export default function DailyBrief() {
  const [loading, setLoading] = useState<boolean>(true);
  const [blockers, setBlockers] = useState<MemoryItem[]>([]);
  const [commitments, setCommitments] = useState<MemoryItem[]>([]);
  const [decisions, setDecisions] = useState<MemoryItem[]>([]);
  const [metrics, setMetrics] = useState<MemoryItem[]>([]);

  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    const memories = await memoryService.getMemories();
    setBlockers(memories.filter((m) => m.type === 'Blocker'));
    setCommitments(memories.filter((m) => m.type === 'Commitment'));
    setDecisions(memories.filter((m) => m.type === 'Decision'));
    setMetrics(memories.filter((m) => m.type === 'Metric'));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadMemories();
      } catch (err) {
        console.error('Failed to load briefing', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMemories]);

  // Pull fresh activity from connected tools, then synthesize the brief from
  // the (now-updated) typed memory, then refresh the on-page sections.
  const generateBrief = async () => {
    setBriefLoading(true);
    setStatusNote('Syncing from your connected tools…');
    try {
      try {
        const ing = await fetch('/api/founderops/engine/ingest', { method: 'POST' });
        const ingData = (await ing.json()) as { success?: boolean; extracted?: number };
        if (ingData?.success) {
          const n = ingData.extracted ?? 0;
          setStatusNote(
            n > 0 ? `Pulled ${n} new item(s) from your tools.` : 'Tools checked — no new activity since last sync.',
          );
        } else {
          setStatusNote('No tools connected yet — building from captured memory.');
        }
      } catch {
        setStatusNote('Tool sync unavailable — building from captured memory.');
      }

      const res = await fetch('/api/founderops/engine/brief', { method: 'POST' });
      const data = (await res.json()) as { brief?: string; error?: string };
      setAiBrief(data.brief ?? data.error ?? 'No brief generated.');
      await loadMemories();
    } catch {
      setAiBrief('⚠️ Could not generate the brief. Check that you are signed in.');
    } finally {
      setBriefLoading(false);
    }
  };

  const getSourceIcon = (source: SourceSystem) => {
    switch (source) {
      case 'Gmail': return <Mail className="w-3.5 h-3.5 text-rose-400" />;
      case 'Slack': return <Slack className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Linear': return <FolderKanban className="w-3.5 h-3.5 text-purple-400" />;
      case 'Notion': return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'Calendar': return <CalendarDays className="w-3.5 h-3.5 text-teal-400" />;
      case 'Stripe': return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const openMemoryDetails = (id: string) => {
    setSelectedMemoryId(id);
    setIsPanelOpen(true);
  };

  // ── Priority grouping (real data) ──────────────────────────────
  const now = Date.now();
  const isOverdue = (m: MemoryItem) =>
    m.commitmentDetails?.status === 'Open' &&
    !!m.commitmentDetails?.deadline &&
    new Date(m.commitmentDetails.deadline).getTime() < now;

  const highPriority: MemoryItem[] = [
    ...blockers.filter((b) => b.blockerDetails?.status === 'Open' && b.blockerDetails?.severity === 'High'),
    ...commitments.filter(isOverdue),
  ];
  const mediumPriority: MemoryItem[] = [
    ...blockers.filter((b) => b.blockerDetails?.status === 'Open' && b.blockerDetails?.severity !== 'High'),
    ...commitments.filter((c) => c.commitmentDetails?.status === 'Open' && !isOverdue(c)),
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const totalRecords = blockers.length + commitments.length + decisions.length + metrics.length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Loading your founder brief…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Morning Briefing
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Daily Founder Brief</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{today} · {totalRecords} records in memory</p>
        </div>
        <button
          onClick={generateBrief}
          disabled={briefLoading}
          className="inline-flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-border/40 disabled:text-muted-foreground text-white px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${briefLoading ? 'animate-spin' : ''}`} />
          {briefLoading ? 'Working…' : aiBrief ? 'Sync & regenerate' : 'Sync & generate brief'}
        </button>
      </div>

      {/* AI narrative brief */}
      <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> AI Daily Brief
          </span>
          {statusNote && <span className="text-[10px] font-mono text-muted-foreground">{statusNote}</span>}
        </div>
        {aiBrief ? (
          <BriefMarkdown text={aiBrief} />
        ) : (
          !briefLoading && (
            <p className="text-xs text-muted-foreground">
              Click <span className="text-indigo-300 font-semibold">Sync &amp; generate brief</span> — we pull fresh
              activity from your connected tools, then the intelligence engine (NIM) synthesizes an opinionated brief
              from your typed founder memory.
            </p>
          )
        )}
      </div>

      {/* Priority-grouped real memory */}
      <PrioritySection
        title="High Priority"
        accent="rose"
        icon={<AlertOctagon className="w-4 h-4" />}
        items={highPriority}
        empty="No high-priority blockers or overdue commitments. 🎉"
        getSourceIcon={getSourceIcon}
        onOpen={openMemoryDetails}
        isOverdue={isOverdue}
      />

      <PrioritySection
        title="Needs Attention"
        accent="amber"
        icon={<CheckSquare className="w-4 h-4" />}
        items={mediumPriority}
        empty="Nothing else open right now."
        getSourceIcon={getSourceIcon}
        onOpen={openMemoryDetails}
        isOverdue={isOverdue}
      />

      {/* Decisions + Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Recent Decisions
          </h3>
          {decisions.length === 0 && <p className="text-[11px] text-muted-foreground">No decisions captured yet.</p>}
          {decisions.slice(0, 5).map((d) => (
            <div
              key={d.id}
              onClick={() => openMemoryDetails(d.id)}
              className="p-3 bg-indigo-500/[0.04] border border-indigo-500/15 rounded-lg hover:border-indigo-500/40 cursor-pointer transition-colors"
            >
              <h5 className="text-xs font-bold text-white">{d.title}</h5>
              {d.decisionDetails?.reason && (
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">Why: {d.decisionDetails.reason}</p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Metric Movements
          </h3>
          {metrics.length === 0 && <p className="text-[11px] text-muted-foreground">No metrics captured yet.</p>}
          {metrics.slice(0, 5).map((m) => (
            <div
              key={m.id}
              onClick={() => openMemoryDetails(m.id)}
              className="p-3 bg-amber-500/[0.04] border border-amber-500/15 rounded-lg hover:border-amber-500/40 cursor-pointer transition-colors flex items-center justify-between gap-3"
            >
              <h5 className="text-xs font-bold text-white">{m.metricDetails?.name ?? m.title}</h5>
              <div className="flex items-baseline gap-1.5 shrink-0">
                {m.metricDetails?.new_value !== undefined && (
                  <span className="text-xs text-white font-mono">{String(m.metricDetails.new_value)}</span>
                )}
                {m.metricDetails?.change && (
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded font-mono">
                    {String(m.metricDetails.change)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MemoryDetailPanel
        memoryId={selectedMemoryId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNavigateToMemory={(id) => openMemoryDetails(id)}
      />
    </div>
  );
}

/* ── Priority section block ──────────────────────────────────────── */

function PrioritySection({
  title,
  accent,
  icon,
  items,
  empty,
  getSourceIcon,
  onOpen,
  isOverdue,
}: {
  title: string;
  accent: 'rose' | 'amber';
  icon: React.ReactNode;
  items: MemoryItem[];
  empty: string;
  getSourceIcon: (s: SourceSystem) => React.ReactNode;
  onOpen: (id: string) => void;
  isOverdue: (m: MemoryItem) => boolean;
}) {
  const accentText = accent === 'rose' ? 'text-rose-400' : 'text-amber-400';
  const accentBorder = accent === 'rose' ? 'border-rose-500/15 hover:border-rose-500/40' : 'border-amber-500/15 hover:border-amber-500/40';
  const accentBg = accent === 'rose' ? 'bg-rose-500/[0.04]' : 'bg-amber-500/[0.04]';

  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-bold uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2 ${accentText}`}>
        {icon}
        {title}
        <span className="ml-1 text-[10px] font-mono text-muted-foreground">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((m) => {
            const overdue = m.type === 'Commitment' && isOverdue(m);
            const badge =
              m.type === 'Blocker'
                ? (m.blockerDetails?.severity ?? 'Blocker')
                : overdue
                  ? 'Overdue'
                  : (m.commitmentDetails?.owner ?? 'Commitment');
            return (
              <div
                key={m.id}
                onClick={() => onOpen(m.id)}
                className={`p-3 ${accentBg} border ${accentBorder} rounded-lg cursor-pointer transition-colors`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 shrink-0 bg-border/40 p-1.5 rounded-md">
                      {getSourceIcon(m.provenance.source)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white">{m.title}</h5>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{m.content}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${overdue ? 'text-rose-300 border-rose-500/40 bg-rose-500/10' : 'text-zinc-300 border-border/50 bg-border/30'}`}>
                    {badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
