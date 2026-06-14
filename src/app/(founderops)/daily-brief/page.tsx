'use client';

import React, { useEffect, useState } from 'react';
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
  ShieldCheck, 
  ArrowRight,
  ClipboardList,
  Play,
  Activity
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { memoryService } from '@/services/memoryService';
import { MemoryItem, SourceSystem } from '@/types';
import MemoryDetailPanel from '@/components/MemoryDetailPanel';

export default function DailyBrief() {
  const [loading, setLoading] = useState<boolean>(true);
  const [yesterdayActivity, setYesterdayActivity] = useState<MemoryItem[]>([]);
  const [criticalBlockers, setCriticalBlockers] = useState<MemoryItem[]>([]);
  const [metricChanges, setMetricChanges] = useState<MemoryItem[]>([]);
  const [openCommitments, setOpenCommitments] = useState<MemoryItem[]>([]);
  const [decisionsMade, setDecisionsMade] = useState<MemoryItem[]>([]);
  
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  
  const [actionDrafted, setActionDrafted] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadBrief() {
      setLoading(true);
      try {
        const memories = await memoryService.getMemories();
        
        // Yesterday's activity (memories matching daysAgo(1) or daysAgo(2))
        const activity = memories.filter((m) => 
          m.id.includes('blocker-10') || m.id.includes('metric-6') || m.id.includes('mem-16') || m.id.includes('mem-25') || m.id.includes('mem-35')
        );
        setYesterdayActivity(activity);

        // Open Blockers
        const blockers = memories.filter((m) => m.type === 'Blocker' && m.blockerDetails?.status === 'Open').slice(0, 3);
        setCriticalBlockers(blockers);

        // Metric Changes
        const metrics = memories.filter((m) => m.type === 'Metric').slice(0, 3);
        setMetricChanges(metrics);

        // Open commitments
        const commitments = memories.filter((m) => m.type === 'Commitment' && m.commitmentDetails?.status === 'Open').slice(0, 3);
        setOpenCommitments(commitments);

        // Recent decisions
        const decisions = memories.filter((m) => m.type === 'Decision').slice(0, 3);
        setDecisionsMade(decisions);

      } catch (err) {
        console.error('Failed to load briefing', err);
      } finally {
        setLoading(false);
      }
    }
    loadBrief();
  }, []);

  const getSourceIcon = (source: SourceSystem) => {
    switch (source) {
      case 'Gmail': return <Mail className="w-3.5 h-3.5 text-rose-400" />;
      case 'Slack': return <Slack className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Linear': return <FolderKanban className="w-3.5 h-3.5 text-purple-400" />;
      case 'Notion': return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'Calendar': return <CalendarDays className="w-3.5 h-3.5 text-teal-400" />;
      case 'Stripe': return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const openMemoryDetails = (id: string) => {
    setSelectedMemoryId(id);
    setIsPanelOpen(true);
  };

  const triggerDraftAction = () => {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      setActionDrafted(true);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Drafting morning briefing reports...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto w-full select-none text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Morning Briefing Summary
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Daily Founder Brief</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational review for **June 14, 2026**. Structured from workspace ingestion runs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-muted-foreground font-mono">Status: Ready</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Main Newsletter Layout Sheet */}
      <div className="bg-[#0b0c0f] border border-border/80 rounded-2xl p-8 space-y-8 shadow-xl relative overflow-hidden">
        {/* Decorative Grid Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />
        
        {/* Part 1: Recommended Priorities */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            Recommended Priorities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-border/20 border border-border/45 rounded-xl space-y-2.5">
              <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 px-1.5 py-0.5 rounded uppercase font-bold">Priority 1</span>
              <h4 className="text-xs font-bold text-white">Review Stripe-to-TrustClaw sandbox provisioning webhooks</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Auth deployment is due today. Deploying clears the onboarding queues for the 42 corporate teams currently stuck waiting.
              </p>
            </div>
            <div className="p-4 bg-border/20 border border-border/45 rounded-xl space-y-2.5">
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 px-1.5 py-0.5 rounded uppercase font-bold">Priority 2</span>
              <h4 className="text-xs font-bold text-white">Review draft Upwork compliance copywriter briefs</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Outstanding for 2 days. Securing a copywriter unblocks our Vanta SOC2 checklists and resolves legal audit delays.
              </p>
            </div>
          </div>
        </div>

        {/* Part 2: Yesterday's Core Activity Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Yesterday's Key Activity
          </h3>
          <div className="space-y-3">
            {yesterdayActivity.map((act) => (
              <div 
                key={act.id}
                onClick={() => openMemoryDetails(act.id)}
                className="flex items-start gap-3 p-3 hover:bg-border/20 border border-transparent hover:border-border/40 rounded-lg cursor-pointer transition-all duration-150"
              >
                <div className="mt-0.5 shrink-0 bg-border/40 p-1.5 rounded-md">
                  {getSourceIcon(act.provenance.source)}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {act.content}
                  </p>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono mt-1">
                    <span>By {act.provenance.author}</span>
                    <span>•</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 3: Split Blockers, Decisions & Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Critical Blockers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider border-b border-border/20 pb-2 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              Critical Blockers
            </h4>
            <div className="space-y-2">
              {criticalBlockers.map((b) => (
                <div 
                  key={b.id}
                  onClick={() => openMemoryDetails(b.id)}
                  className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-lg hover:border-rose-500/40 cursor-pointer transition-colors"
                >
                  <h5 className="text-xs font-bold text-white line-clamp-1">{b.title}</h5>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mt-1">{b.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Important Decisions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-border/20 pb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Recent Decisions
            </h4>
            <div className="space-y-2">
              {decisionsMade.map((d) => (
                <div 
                  key={d.id}
                  onClick={() => openMemoryDetails(d.id)}
                  className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-lg hover:border-indigo-500/40 cursor-pointer transition-colors"
                >
                  <h5 className="text-xs font-bold text-white line-clamp-1">{d.title}</h5>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mt-1">{d.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Metric Updates */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-border/20 pb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Metrics Changes
            </h4>
            <div className="space-y-2">
              {metricChanges.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => openMemoryDetails(m.id)}
                  className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg hover:border-amber-500/40 cursor-pointer transition-colors flex flex-col justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{m.metricDetails?.name}</h5>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xs text-white font-mono">{m.metricDetails?.new_value}</span>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded font-mono">
                        {m.metricDetails?.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Part 4: Open Commitments Checklist */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            Open Follow-Ups
          </h3>
          <div className="space-y-2.5">
            {openCommitments.map((c) => (
              <div 
                key={c.id}
                onClick={() => openMemoryDetails(c.id)}
                className="flex items-center justify-between p-3.5 bg-border/20 border border-border/30 rounded-xl hover:border-border/60 hover:bg-border/35 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-zinc-100 font-medium">{c.commitmentDetails?.task}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                  <span>Owner: {c.commitmentDetails?.owner}</span>
                  <span className="bg-border/40 px-2 py-0.5 rounded text-rose-400 border border-rose-500/15 font-bold uppercase">
                    Due {c.commitmentDetails?.deadline ? new Date(c.commitmentDetails.deadline).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 5: Secure Action Drafting Sandbox (Linear / Slack draft trigger) */}
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Secure Action Sandbox Proposals
            </h4>
            <p className="text-[11px] text-muted-foreground max-w-xl">
              We parsed your outstanding Cognito hotfix commitment and sandbox provisioning blocker. Click below to draft secure script execution scripts inside the TrustClaw sandboxing wrapper.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {actionDrafted ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/35 px-4 py-2.5 rounded-lg text-xs text-emerald-400 font-bold font-mono">
                <ShieldCheck className="w-4 h-4" />
                DRAFT SENT FOR APPROVAL
              </div>
            ) : (
              <button
                onClick={triggerDraftAction}
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                    <span>Deploying sandbox code...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Draft Sandbox Action in TrustClaw</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* slide-out panel for memory details */}
      <MemoryDetailPanel 
        memoryId={selectedMemoryId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNavigateToMemory={(id) => openMemoryDetails(id)}
      />
    </div>
  );
}
