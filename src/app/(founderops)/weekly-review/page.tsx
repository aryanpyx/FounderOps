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
  TrendingDown
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { memoryService } from '@/services/memoryService';
import { MemoryItem, SourceSystem } from '@/types';
import MemoryDetailPanel from '@/components/MemoryDetailPanel';

export default function WeeklyReview() {
  const [loading, setLoading] = useState<boolean>(true);
  const [keyDecisions, setKeyDecisions] = useState<MemoryItem[]>([]);
  const [completedCommitments, setCompletedCommitments] = useState<MemoryItem[]>([]);
  const [openRisks, setOpenRisks] = useState<MemoryItem[]>([]);
  const [metricSummary, setMetricSummary] = useState<MemoryItem[]>([]);
  
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadWeeklyReview() {
      setLoading(true);
      try {
        const memories = await memoryService.getMemories();
        
        // Decisions
        setKeyDecisions(memories.filter((m) => m.type === 'Decision').slice(0, 4));
        
        // Completed commitments
        setCompletedCommitments(memories.filter((m) => m.type === 'Commitment' && m.commitmentDetails?.status === 'Fulfilled').slice(0, 4));
        
        // Open Risks / Blockers
        setOpenRisks(memories.filter((m) => m.type === 'Blocker' && m.blockerDetails?.status === 'Open').slice(0, 4));
        
        // Metric changes
        setMetricSummary(memories.filter((m) => m.type === 'Metric').slice(0, 4));
      } catch (err) {
        console.error('Failed to load weekly review', err);
      } finally {
        setLoading(false);
      }
    }
    loadWeeklyReview();
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Aggregating weekly execution logs...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto w-full select-none text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Strategic Operations Audit
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Weekly Operating Review</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit report compiled for week ending **June 14, 2026**.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-border/20 border border-border/40 p-2.5 rounded-lg text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-muted-foreground font-mono">Archive Reference: #WOR-24</span>
        </div>
      </div>

      {/* Main Review Sheet Card */}
      <div className="bg-[#0b0c0f] border border-border/80 rounded-2xl p-8 space-y-8 shadow-xl">
        
        {/* Progress Overview Memo */}
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-2">
          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 font-mono uppercase">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse-subtle" />
            Executive Progress Summary
          </h4>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            This week, our team crossed a critical financial milestones, reaching **$10,500 MRR** (+25% growth) after transitioning Pro packages to seat-based parameters and deploying hotfixes for trial account data CSV exports (cutting churn risks to 1.8%). Operational velocity was initially restricted by staging Cognito authentication redirect loop failure, forcing a **one-week delay** to our public beta (rescheduled to June 19). Deploying self-hosted EC2 actions runner configurations resolved pipeline queue bottlenecks, raising the weekly sprint completion rate to 88%.
          </p>
        </div>

        {/* 1. Key Decisions Made */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Strategic Decisions Finalized
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyDecisions.map((dec) => (
              <div 
                key={dec.id}
                onClick={() => openMemoryDetails(dec.id)}
                className="p-4 bg-border/20 border border-border/40 rounded-xl hover:border-border/85 cursor-pointer transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{dec.title}</h4>
                  {getSourceIcon(dec.provenance.source)}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{dec.content}</p>
                <div className="text-[10px] text-muted-foreground font-mono pt-1">
                  Approved: {dec.decisionDetails?.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Commitments Completed */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Commitments Fulfilled This Week
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCommitments.map((com) => (
              <div 
                key={com.id}
                onClick={() => openMemoryDetails(com.id)}
                className="p-4 bg-border/20 border border-border/40 rounded-xl hover:border-border/85 cursor-pointer transition-colors flex items-start gap-3"
              >
                <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs mt-0.5">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white leading-tight">{com.commitmentDetails?.task}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-1.5">
                    <span>By {com.commitmentDetails?.owner}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {getSourceIcon(com.provenance.source)} {com.provenance.source}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Open Risks & Blockers */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Outstanding Execution Risks
          </h3>
          <div className="space-y-2.5">
            {openRisks.map((risk) => (
              <div 
                key={risk.id}
                onClick={() => openMemoryDetails(risk.id)}
                className="flex items-center justify-between p-3.5 bg-border/20 border border-border/30 hover:border-border/60 cursor-pointer rounded-xl transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 mr-4">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase font-mono ${
                    risk.blockerDetails?.severity === 'High' ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' :
                    'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  }`}>
                    {risk.blockerDetails?.severity} Severity
                  </span>
                  <span className="text-xs font-bold text-zinc-100 truncate">{risk.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] text-muted-foreground font-mono">
                  {getSourceIcon(risk.provenance.source)}
                  <span>Ingested: {new Date(risk.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Business Metrics Changes */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Performance & Metrics Deltas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricSummary.map((met) => (
              <div 
                key={met.id}
                onClick={() => openMemoryDetails(met.id)}
                className="p-4 bg-border/20 border border-border/40 hover:border-border/80 cursor-pointer rounded-xl transition-all"
              >
                <span className="text-[10px] text-muted-foreground font-mono block mb-1">{met.metricDetails?.name}</span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-lg font-bold text-white font-mono">{met.metricDetails?.new_value}</span>
                  <span className={`text-[10px] font-bold font-mono px-1 rounded flex items-center gap-0.5 ${
                    met.metricDetails?.change.startsWith('+') 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {met.metricDetails?.change}
                  </span>
                </div>
              </div>
            ))}
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
