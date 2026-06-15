'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Mail, 
  FolderKanban, 
  FileText, 
  CalendarDays, 
  TrendingUp, 
  ExternalLink,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { memoryService } from '@/services/memoryService';
import type { MemoryItem, SourceSystem } from '@/types';

interface MemoryDetailPanelProps {
  memoryId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMemory?: (id: string) => void;
}

export default function MemoryDetailPanel({
  memoryId,
  isOpen,
  onClose,
  onNavigateToMemory
}: MemoryDetailPanelProps) {
  const [item, setItem] = useState<MemoryItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !memoryId) return;

    async function loadDetails() {
      setLoading(true);
      try {
        const data = await memoryService.getMemoryById(memoryId!);
        setItem(data.item);
        setRelatedItems(data.relatedItems);
      } catch (err) {
        console.error('Failed to load memory details', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [memoryId, isOpen]);

  if (!isOpen) return null;

  const getSourceIcon = (source: SourceSystem) => {
    switch (source) {
      case 'Gmail': return <Mail className="w-4 h-4 text-rose-400" />;
      case 'Slack': return <Slack className="w-4 h-4 text-indigo-400" />;
      case 'Linear': return <FolderKanban className="w-4 h-4 text-purple-400" />;
      case 'Notion': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'Calendar': return <CalendarDays className="w-4 h-4 text-teal-400" />;
      case 'Stripe': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Decision':
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
          text: 'text-indigo-400',
          border: 'border-indigo-500/30'
        };
      case 'Commitment':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30'
        };
      case 'Blocker':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
          text: 'text-rose-400',
          border: 'border-rose-500/30'
        };
      case 'Metric':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
          text: 'text-amber-400',
          border: 'border-amber-500/30'
        };
      default:
        return {
          bg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300',
          text: 'text-zinc-400',
          border: 'border-zinc-500/30'
        };
    }
  };

  const handleRelatedClick = (id: string) => {
    if (onNavigateToMemory) {
      onNavigateToMemory(id);
    }
  };

  const typeStyle = item ? getTypeStyles(item.type) : { bg: '', text: '', border: '' };

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide out drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[460px] bg-card border-l border-border z-50 shadow-2xl flex flex-col h-full animate-slide-in select-none text-foreground">
        {/* Panel Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Verified Memory Details</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-border/60 rounded-md text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs font-mono">Retrieving state...</span>
          </div>
        ) : !item ? (
          <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
            <span className="text-xs">No memory selected</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Classification Tag */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${typeStyle.bg}`}>
                  {item.type}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-border/20 border border-border/40 px-2 py-0.5 rounded">
                  {getSourceIcon(item.provenance.source)}
                  {item.provenance.source}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white leading-snug">{item.title}</h2>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Abstract Summary</label>
              <p className="text-xs text-zinc-300 leading-relaxed bg-border/20 border border-border/40 p-3.5 rounded-lg">
                {item.content}
              </p>
            </div>

            {/* Type Specific Context Cards */}
            {item.type === 'Decision' && item.decisionDetails && (
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg space-y-2">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  Decision Details
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="text-zinc-300"><span className="text-muted-foreground">Choice:</span> {item.decisionDetails.decision}</p>
                  <p className="text-zinc-300"><span className="text-muted-foreground">Reason:</span> {item.decisionDetails.reason}</p>
                  <p className="text-zinc-300"><span className="text-muted-foreground">Approved Date:</span> {item.decisionDetails.date}</p>
                </div>
              </div>
            )}

            {item.type === 'Commitment' && item.commitmentDetails && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Commitment Parameters
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="text-zinc-300"><span className="text-muted-foreground">Owner:</span> {item.commitmentDetails.owner}</p>
                  <p className="text-zinc-300"><span className="text-muted-foreground">Task:</span> {item.commitmentDetails.task}</p>
                  <p className="text-zinc-300"><span className="text-muted-foreground">Deadline:</span> {new Date(item.commitmentDetails.deadline).toLocaleDateString()}</p>
                  <p className="text-zinc-300">
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <span className={`font-semibold ${
                      item.commitmentDetails.status === 'Fulfilled' ? 'text-emerald-400' :
                      item.commitmentDetails.status === 'Overdue' ? 'text-rose-400' :
                      'text-amber-400'
                    }`}>
                      {item.commitmentDetails.status}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {item.type === 'Blocker' && item.blockerDetails && (
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg space-y-2">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1">
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  Blocker Severity Details
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="text-zinc-300"><span className="text-muted-foreground">Issue:</span> {item.blockerDetails.issue}</p>
                  <p className="text-zinc-300">
                    <span className="text-muted-foreground">Severity:</span>{' '}
                    <span className={`font-bold ${
                      item.blockerDetails.severity === 'High' ? 'text-rose-400' :
                      item.blockerDetails.severity === 'Medium' ? 'text-amber-400' :
                      'text-blue-400'
                    }`}>
                      {item.blockerDetails.severity}
                    </span>
                  </p>
                  <p className="text-zinc-300"><span className="text-muted-foreground">Status:</span> {item.blockerDetails.status}</p>
                </div>
              </div>
            )}

            {item.type === 'Metric' && item.metricDetails && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Metric Shift Report
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="text-zinc-300"><span className="text-muted-foreground">Metric Name:</span> {item.metricDetails.name}</p>
                  <p className="text-zinc-300"><span className="text-muted-foreground">Old Value:</span> {item.metricDetails.old_value}</p>
                  <p className="text-zinc-300"><span className="text-muted-foreground">New Value:</span> {item.metricDetails.new_value}</p>
                  <p className="text-zinc-300">
                    <span className="text-muted-foreground">Delta Change:</span>{' '}
                    <span className={`font-bold ${(item.metricDetails.change ?? '').startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.metricDetails.change ?? '—'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Ingest Source Message Quote */}
            {item.provenance.raw_content && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                  Raw Source Event Context
                </label>
                <div className="p-3 bg-[#0d0e12] border border-border/80 rounded-lg font-mono text-[11px] text-zinc-300 break-words whitespace-pre-wrap leading-relaxed">
                  "{item.provenance.raw_content}"
                </div>
              </div>
            )}

            {/* Provenance Metadata Table */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Metadata Provenance</label>
              <div className="border border-border bg-[#0d0e12] rounded-lg text-xs divide-y divide-border">
                <div className="flex p-2.5 justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> Author
                  </span>
                  <span className="text-white font-medium">{item.provenance.author}</span>
                </div>
                <div className="flex p-2.5 justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Ingest Time
                  </span>
                  <span className="text-white font-medium">{new Date(item.provenance.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex p-2.5 justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" /> Message ID
                  </span>
                  <span className="text-white font-mono">{item.provenance.message_id}</span>
                </div>
              </div>
            </div>

            {/* Relations Section */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Connected Memory Nodes</label>
              {relatedItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">No directly connected memory items</p>
              ) : (
                <div className="space-y-2">
                  {relatedItems.map((rel) => {
                    const relStyles = getTypeStyles(rel.type);
                    return (
                      <div
                        key={rel.id}
                        onClick={() => handleRelatedClick(rel.id)}
                        className="flex items-center justify-between p-2.5 bg-border/20 border border-border/40 hover:border-border/80 hover:bg-border/30 rounded-lg cursor-pointer transition-all duration-150 group"
                      >
                        <div className="flex items-center gap-2 min-w-0 mr-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${relStyles.bg}`}>
                            {rel.type}
                          </span>
                          <span className="text-xs text-zinc-300 font-medium truncate group-hover:text-white transition-colors">
                            {rel.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel Footer */}
        {item && (
          <div className="p-4 border-t border-border bg-[#0d0e12] flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> TrustClaw Sandbox Integrity Verified
            </span>
            <a
              href={item.provenance.link_to_source}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Inspect Source <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </>
  );
}
