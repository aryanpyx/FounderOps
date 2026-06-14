'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  TrendingUp, 
  CheckSquare, 
  AlertOctagon, 
  Zap, 
  Gauge,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid,
  Cell
} from 'recharts';
import { analyticsService, AnalyticsSummary } from '@/services/analyticsService';

export default function FounderInsights() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const stats = await analyticsService.getAnalyticsSummary();
        setData(stats);
      } catch (err) {
        console.error('Failed to load insights statistics', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Compiling execution metrics analytics...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full select-none text-foreground">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Workspace Core Analytics
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Founder Insights</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-border/20 border border-border/40 px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Last sync calculation: <span className="text-white font-mono font-bold">12 minutes ago</span></span>
        </div>
      </div>

      {/* Top Split: Health Dial Gauge & Core Metrics overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Circular Dial Gauge for Health Score */}
        <div className="p-6 bg-card border border-border/65 rounded-xl flex flex-col items-center justify-center space-y-4 text-center">
          <div className="text-left w-full">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              Operational Health Index
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Real-time aggregate metric of startup stability.</p>
          </div>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Circular path */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="#1f1f23"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="url(#healthGrad)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - data.healthScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold font-mono text-white leading-none">
                {data.healthScore}
              </span>
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold mt-1">
                Optimized
              </span>
            </div>
          </div>
          <div className="text-xs text-zinc-300 max-w-xs leading-relaxed">
            Your health index resolved to **{data.healthScore}%** following this week's database indexing and developer runner hotfixes.
          </div>
        </div>

        {/* Right Span: Categories statistics breakdown */}
        <div className="lg:col-span-2 p-6 bg-card border border-border/65 rounded-xl space-y-5">
          <div>
            <h3 className="font-bold text-sm text-white">System Resource & Risk Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Aggregated task weights compiled from connected workspaces.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column progress bars */}
            <div className="space-y-4">
              {data.categoryBreakdown.slice(0, 3).map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-200">{item.category}</span>
                    <span className="text-muted-foreground font-mono">{item.count}/{item.max} nodes</span>
                  </div>
                  <div className="w-full h-2 bg-border/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${(item.count / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column progress bars */}
            <div className="space-y-4">
              {data.categoryBreakdown.slice(3).map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-200">{item.category}</span>
                    <span className="text-muted-foreground font-mono">{item.count}/{item.max} nodes</span>
                  </div>
                  <div className="w-full h-2 bg-border/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${(item.count / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="p-3 bg-border/25 border border-border/40 rounded-lg text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                <span>Total connected data points:</span>
                <span className="text-white font-bold">142 nodes</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Blocker frequencies BarChart & Decision Trends LineChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Blocker Severity Frequencies */}
        <div className="p-6 bg-card border border-border/65 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Active Blocker Distribution
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Count of unresolved obstacles segmented by severity tags.</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.blockerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="severity" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #1f1f23', borderRadius: '8px' }} 
                  labelStyle={{ fontSize: '10px', color: '#a1a1aa' }}
                  itemStyle={{ fontSize: '11px', color: '#ffffff' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.blockerStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Trends over time */}
        <div className="p-6 bg-card border border-border/65 rounded-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Decision Ingestion Trends
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Chronological occurrence rate of strategic decisions.</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.decisionTrends} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #1f1f23', borderRadius: '8px' }} 
                  labelStyle={{ fontSize: '10px', color: '#a1a1aa' }}
                  itemStyle={{ fontSize: '11px', color: '#ffffff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} dot={{ stroke: '#6366f1', strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row: Commitment Completion rates by team owner */}
      <div className="p-6 bg-card border border-border/65 rounded-xl space-y-4">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Operational Commitment Resolution Velocity
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Individual completion rates mapping out developer accountability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.completionStats.map((item, idx) => (
            <div 
              key={idx}
              className="p-4 bg-border/20 border border-border/40 rounded-xl space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{item.owner}</span>
                <span className="text-[10px] font-mono text-muted-foreground bg-border px-1.5 py-0.5 rounded">
                  {item.completed} completed
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white">{item.rate}%</span>
                <span className="text-[10px] text-muted-foreground">resolution rate</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    item.rate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    item.rate >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                    'bg-gradient-to-r from-rose-500 to-red-400'
                  }`} 
                  style={{ width: `${item.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
