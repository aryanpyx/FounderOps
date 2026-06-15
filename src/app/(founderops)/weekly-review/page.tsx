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

export default function WeeklyReview() {
  const [loading, setLoading] = useState<boolean>(true);
  const [keyDecisions, setKeyDecisions] = useState<MemoryItem[]>([]);
  const [completedCommitments, setCompletedCommitments] = useState<MemoryItem[]>([]);
  const [openRisks, setOpenRisks] = useState<MemoryItem[]>([]);
  const [metricSummary, setMetricSummary] = useState<MemoryItem[]>([]);

  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const [aiReview, setAiReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    const memories = await memoryService.getMemories();
    setKeyDecisions(memories.filter((m) => m.type === 'Decision').slice(0, 6));
    setCompletedCommitments(
      memories.filter((m) => m.type === 'Commitment' && m.commitmentDetails?.status === 'Fulfilled').slice(0, 6),
    );
    setOpenRisks(memories.filter((m) => m.type === 'Blocker' && m.blockerDetails?.status === 'Open').slice(0, 6));
    setMetricSummary(memories.filter((m) => m.type === 'Metric').slice(0, 8));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadMemories();
      } catch (err) {
        console.error('Failed to load weekly review', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMemories]);

  const generateReview = async () => {
    setReviewLoading(true);
    setStatusNote('Syncing from your connected tools…');
    try {
      try {
        const ing = await fetch('/api/founderops/engine/ingest', { method: 'POST' });
        const ingData = (await ing.json()) as { success?: boolean; extracted?: number };
        if (ingData?.success) {
          const n = ingData.extracted ?? 0;
          setStatusNote(n > 0 ? `Pulled ${n} new item(s) from your tools.` : 'Tools checked — no new activity since last sync.');
        } else {
          setStatusNote('No tools connected yet — building from captured memory.');
        }
      } catch {
        setStatusNote('Tool sync unavailable — building from captured memory.');
      }

      const res = await fetch('/api/founderops/engine/weekly', { method: 'POST' });
      const data = (await res.json()) as { review?: string; error?: string };
      setAiReview(data.review ?? data.error ?? 'No review generated.');
      await loadMemories();
    } catch {
      setAiReview('⚠️ Could not generate the review. Check that you are signed in.');
    } finally {
      setReviewLoading(false);
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

  // Week range (Mon–today) for the header.
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Loading your weekly review…</span>
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
            Weekly Operating Review
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">This Week in Review</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Week of {weekLabel}</p>
        </div>
        <button
          onClick={generateReview}
          disabled={reviewLoading}
          className="inline-flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-border/40 disabled:text-muted-foreground text-white px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reviewLoading ? 'animate-spin' : ''}`} />
          {reviewLoading ? 'Working…' : aiReview ? 'Sync & regenerate' : 'Sync & generate review'}
        </button>
      </div>

      {/* AI narrative review */}
      <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> AI Weekly Review
          </span>
          {statusNote && <span className="text-[10px] font-mono text-muted-foreground">{statusNote}</span>}
        </div>
        {aiReview ? (
          <BriefMarkdown text={aiReview} />
        ) : (
          !reviewLoading && (
            <p className="text-xs text-muted-foreground">
              Click <span className="text-indigo-300 font-semibold">Sync &amp; generate review</span> — we pull the
              week&apos;s activity from your connected tools, then the intelligence engine synthesizes a strategic
              review from your typed founder memory.
            </p>
          )
        )}
      </div>

      {/* Decisions + Commitments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Decisions Finalized
            <span className="ml-1 text-[10px] font-mono text-muted-foreground">({keyDecisions.length})</span>
          </h3>
          {keyDecisions.length === 0 && <p className="text-[11px] text-muted-foreground">No decisions captured this week.</p>}
          {keyDecisions.map((dec) => (
            <div
              key={dec.id}
              onClick={() => openMemoryDetails(dec.id)}
              className="p-3 bg-indigo-500/[0.04] border border-indigo-500/15 rounded-lg hover:border-indigo-500/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-white">{dec.title}</h4>
                {getSourceIcon(dec.provenance.source)}
              </div>
              {dec.decisionDetails?.reason && (
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">Why: {dec.decisionDetails.reason}</p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> Commitments Fulfilled
            <span className="ml-1 text-[10px] font-mono text-muted-foreground">({completedCommitments.length})</span>
          </h3>
          {completedCommitments.length === 0 && <p className="text-[11px] text-muted-foreground">No commitments marked fulfilled yet.</p>}
          {completedCommitments.map((com) => (
            <div
              key={com.id}
              onClick={() => openMemoryDetails(com.id)}
              className="p-3 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-lg hover:border-emerald-500/40 cursor-pointer transition-colors flex items-start gap-3"
            >
              <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white leading-tight">{com.commitmentDetails?.task ?? com.title}</h4>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">By {com.commitmentDetails?.owner ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Risks */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4" /> Outstanding Risks
          <span className="ml-1 text-[10px] font-mono text-muted-foreground">({openRisks.length})</span>
        </h3>
        {openRisks.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No open blockers. Clean slate. 🎉</p>
        ) : (
          <div className="space-y-2">
            {openRisks.map((risk) => (
              <div
                key={risk.id}
                onClick={() => openMemoryDetails(risk.id)}
                className="flex items-center justify-between p-3 bg-rose-500/[0.04] border border-rose-500/15 hover:border-rose-500/40 cursor-pointer rounded-lg transition-colors gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase font-mono shrink-0 ${
                    risk.blockerDetails?.severity === 'High'
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  }`}>
                    {risk.blockerDetails?.severity ?? 'Open'}
                  </span>
                  <span className="text-xs font-bold text-zinc-100 truncate">{risk.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground font-mono">
                  {getSourceIcon(risk.provenance.source)}
                  <span>{new Date(risk.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Performance & Metric Deltas
          <span className="ml-1 text-[10px] font-mono text-muted-foreground">({metricSummary.length})</span>
        </h3>
        {metricSummary.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No metrics captured this week.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricSummary.map((met) => {
              const change = String(met.metricDetails?.change ?? '');
              const positive = change.startsWith('+') || /increase/i.test(change);
              return (
                <div
                  key={met.id}
                  onClick={() => openMemoryDetails(met.id)}
                  className="p-4 bg-border/20 border border-border/40 hover:border-border/80 cursor-pointer rounded-xl transition-colors"
                >
                  <span className="text-[10px] text-muted-foreground font-mono block mb-1 truncate">{met.metricDetails?.name ?? met.title}</span>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-lg font-bold text-white font-mono">{String(met.metricDetails?.new_value ?? '')}</span>
                    {change && (
                      <span className={`text-[10px] font-bold font-mono px-1 rounded border ${
                        positive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {change}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
