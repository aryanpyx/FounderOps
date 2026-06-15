'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Search, 
  Network, 
  FileText, 
  CalendarDays, 
  TrendingUp, 
  Activity, 
  Settings,
  ShieldCheck,
  Mail,
  FolderKanban,
  CheckSquare,
  Boxes
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { FounderOpsLogo } from '@/components/FounderOpsLogo';
import { analyticsService } from '@/services/analyticsService';

export default function Sidebar() {
  const pathname = usePathname();
  const [healthScore, setHealthScore] = useState<number>(85);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  useEffect(() => {
    async function loadHealth() {
      try {
        const stats = await analyticsService.getAnalyticsSummary();
        setHealthScore(stats.healthScore);
      } catch (err) {
        console.error('Failed to fetch health score for sidebar', err);
      } finally {
        setLoadingHealth(false);
      }
    }
    loadHealth();
  }, [pathname]);

  const primaryNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Ask FounderOps', path: '/ask', icon: MessageSquare, badge: 'Ask' },
    { name: 'Memory Explorer', path: '/memory-explorer', icon: Search },
    { name: 'Memory Graph', path: '/memory-graph', icon: Network },
  ];

  const secondaryNavItems = [
    { name: 'Daily Brief', path: '/daily-brief', icon: FileText },
    { name: 'Weekly Review', path: '/weekly-review', icon: CalendarDays },
    { name: 'Founder Insights', path: '/insights', icon: TrendingUp },
  ];

  // Real TrustClaw pages: persistent agent chat (with live tool stream), toolkit
  // connections, and settings. These live under /dashboard/* in the same app.
  const workspaceNavItems = [
    { name: 'Agent Chat', path: '/dashboard', icon: MessageSquare },
    { name: 'Toolkits', path: '/dashboard/toolkits', icon: Boxes },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const connectedSources = [
    { name: 'Gmail', icon: Mail, status: 'synced', color: 'text-rose-400' },
    { name: 'Slack', icon: Slack, status: 'synced', color: 'text-indigo-400' },
    { name: 'Linear', icon: FolderKanban, status: 'synced', color: 'text-purple-400' },
    { name: 'Notion', icon: FileText, status: 'synced', color: 'text-amber-400' },
    { name: 'Calendar', icon: CalendarDays, status: 'synced', color: 'text-teal-400' },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0 shrink-0 text-foreground">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-border flex items-center">
        <FounderOpsLogo size="md" />
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7 scrollbar-thin">
        {/* Primary Views */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
            Intelligence
          </div>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group duration-150 ${
                  isActive
                    ? 'bg-border text-white shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-border/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary Views */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
            Reports & Insights
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all group duration-150 ${
                  isActive
                    ? 'bg-border text-white shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-border/40 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Workspace - real TrustClaw pages (chat, toolkits, settings) */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
            Workspace
          </div>
          {workspaceNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all group duration-150 ${
                  isActive
                    ? 'bg-border text-white shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-border/40 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Ingest Connections */}
        <Link href="/dashboard/toolkits" className="block space-y-2.5">
          <div className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center justify-between hover:text-white transition-colors">
            <span>Data Sources</span>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-1.5">
            {connectedSources.map((src) => {
              const Icon = src.icon;
              return (
                <div
                  key={src.name}
                  className="flex items-center gap-1.5 p-2 bg-border/20 border border-border/30 rounded-md text-[10px] text-muted-foreground hover:border-border/60 hover:text-white transition-all duration-150"
                >
                  <Icon className={`w-3 h-3 ${src.color}`} />
                  <span className="font-medium">{src.name}</span>
                </div>
              );
            })}
          </div>
        </Link>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border bg-card/60 space-y-3">
        {/* Operational Health Indicator */}
        <div className="p-3 bg-border/30 border border-border/50 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Ops Health
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {loadingHealth ? '--' : `${healthScore}%`}
            </span>
          </div>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                healthScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                healthScore >= 65 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
            SJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-none mb-0.5">Sarah Jenkins</p>
            <p className="text-[10px] text-muted-foreground truncate leading-none">Founder & CEO</p>
          </div>
          <div className="flex items-center" title="TrustClaw Secured">
            <ShieldCheck className="w-4 h-4 text-emerald-400 cursor-pointer hover:text-emerald-300 transition-colors" />
          </div>
        </div>
      </div>
    </aside>
  );
}
