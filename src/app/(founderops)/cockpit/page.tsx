'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  AlertOctagon, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Mail, 
  FolderKanban, 
  FileText, 
  CalendarDays, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { dashboardService, type DashboardSummary } from '@/services/dashboardService';
import type { MemoryItem, SourceSystem } from '@/types';
import MemoryDetailPanel from '@/components/MemoryDetailPanel';

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await dashboardService.getDashboardData();
        setData(result);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openMemoryDetails = (id: string) => {
    setSelectedMemoryId(id);
    setIsPanelOpen(true);
  };

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

  const getMemoryTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Decision': return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400';
      case 'Commitment': return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
      case 'Blocker': return 'bg-rose-500/10 border-rose-500/25 text-rose-400';
      case 'Metric': return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
      default: return 'bg-zinc-500/10 border-zinc-500/25 text-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Synthesizing operational context...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full select-none text-foreground">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Decision Intelligence Core
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Founder Cockpit</h2>
        </div>
        <div className="flex items-center gap-3 bg-border/20 border border-border/40 p-2.5 rounded-lg text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse-subtle" />
          <span className="text-muted-foreground">Secure Execution Sandbox Active</span>
          <span className="font-mono text-[10px] bg-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
            Engine Live
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Commitments */}
        <div className="p-5 bg-card border border-border/60 rounded-xl hover:border-border transition-all duration-150 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Active Commitments</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{data.kpis.openCommitmentsCount}</span>
            <span className="text-[10px] text-muted-foreground">outstanding promises</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
        </div>

        {/* KPI 2: Blockers */}
        <div className="p-5 bg-card border border-border/60 rounded-xl hover:border-border transition-all duration-150 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Active Blockers</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{data.kpis.activeBlockersCount}</span>
            <span className="text-[10px] text-muted-foreground">blocking items</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-rose-500 to-red-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
        </div>

        {/* KPI 3: Recent Decisions */}
        <div className="p-5 bg-card border border-border/60 rounded-xl hover:border-border transition-all duration-150 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Recent Decisions</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{data.kpis.recentDecisionsCount}</span>
            <span className="text-[10px] text-muted-foreground">finalized choices</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
        </div>

        {/* KPI 4: MRR Delta */}
        <div className="p-5 bg-card border border-border/60 rounded-xl hover:border-border transition-all duration-150 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Monthly Revenue (MRR)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{data.kpis.mrrChange.currentValue}</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              {data.kpis.mrrChange.changePercentage}
            </span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
        </div>
      </div>

      {/* Today's priorities */}
      <div className="grid grid-cols-1 gap-6">
        <div className="p-6 bg-card border border-border/65 rounded-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                Today's Critical Priorities
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono bg-border px-1.5 py-0.5 rounded">AUTO-SORT</span>
            </div>

            <div className="space-y-3.5">
              {data.priorities.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => openMemoryDetails(item.id)}
                  className="group flex flex-col p-3 bg-border/20 border border-border/30 rounded-lg hover:border-border/80 cursor-pointer transition-all duration-150"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">{item.owner}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                      item.status === 'Overdue' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate transition-colors leading-none">
                    {item.task}
                  </h4>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">{getSourceIcon(item.provenance.source)} {item.provenance.source}</span>
                    <span>Deadline: {new Date(item.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border mt-4">
            <Link 
              href="/memory-explorer" 
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 group"
            >
              Examine All Commitments
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Ingestion activity feed */}
      <div className="p-6 bg-card border border-border/65 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-bold text-sm text-white">Ingested Activity Feed</h3>
            <p className="text-xs text-muted-foreground">Continuous extraction from connected mail, chats, trackers and Stripe accounts.</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Monitoring Integrations...
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recentActivity.map((item) => (
            <div
              key={item.id}
              onClick={() => openMemoryDetails(item.id)}
              className="group p-4 bg-border/20 border border-border/30 hover:border-border/75 rounded-lg cursor-pointer transition-all duration-150 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getMemoryTypeBadgeColor(item.type)}`}>
                    {item.type}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-border/35 border border-border/50 px-1.5 py-0.5 rounded">
                    {getSourceIcon(item.provenance.source)}
                    {item.provenance.source}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                  {item.content}
                </p>
              </div>

              <div className="pt-3.5 border-t border-border/40 mt-3.5 flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                <span>By {item.provenance.author}</span>
                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
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
