'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Mail, 
  FolderKanban, 
  FileText, 
  CalendarDays, 
  TrendingUp, 
  Filter, 
  Sparkles,
  Inbox,
  Clock,
  ExternalLink
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { memoryService } from '@/services/memoryService';
import { MemoryItem, MemoryType, SourceSystem } from '@/types';
import MemoryDetailPanel from '@/components/MemoryDetailPanel';

export default function MemoryExplorer() {
  const [query, setQuery] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MemoryType[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceSystem[]>([]);
  const [results, setResults] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchMemories() {
      setLoading(true);
      try {
        const data = await memoryService.searchMemories(query, selectedTypes, selectedSources);
        setResults(data);
      } catch (err) {
        console.error('Failed to search memories', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMemories();
  }, [query, selectedTypes, selectedSources]);

  const toggleTypeFilter = (type: MemoryType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSourceFilter = (source: SourceSystem) => {
    setSelectedSources(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedSources([]);
    setQuery('');
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

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Decision':
        return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400';
      case 'Commitment':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
      case 'Blocker':
        return 'bg-rose-500/10 border-rose-500/25 text-rose-400';
      case 'Metric':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
      default:
        return 'bg-zinc-500/10 border-zinc-500/25 text-zinc-400';
    }
  };

  const openMemoryDetails = (id: string) => {
    setSelectedMemoryId(id);
    setIsPanelOpen(true);
  };

  const allTypes: MemoryType[] = ['Decision', 'Commitment', 'Blocker', 'Metric'];
  const allSources: SourceSystem[] = ['Gmail', 'Slack', 'Linear', 'Notion', 'Calendar', 'Stripe'];

  return (
    <div className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full select-none text-foreground flex flex-col h-screen overflow-hidden">
      {/* Top Header Section */}
      <div className="flex justify-between items-center pb-4 border-b border-border shrink-0">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Explainable Knowledge Storage
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Memory Explorer</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-border/20 border border-border/40 px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Total Records Index: <span className="text-white font-bold">{results.length} memories</span></span>
        </div>
      </div>

      {/* Main Search Panel: Filters & Search bar */}
      <div className="bg-card border border-border/60 p-4 rounded-xl space-y-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, text, author, or references..."
              className="w-full bg-border/30 border border-border/50 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/80 transition-colors"
            />
          </div>
          {(selectedTypes.length > 0 || selectedSources.length > 0 || query !== '') && (
            <button
              onClick={clearFilters}
              className="px-3.5 py-2 hover:bg-border/60 text-xs text-muted-foreground hover:text-white border border-border/40 hover:border-border rounded-lg transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Categories toggles */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-xs">
          <div className="flex items-center gap-2 min-w-[80px]">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">Type:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTypes.map((type) => {
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-border/20 border-border/40 text-muted-foreground hover:border-border hover:text-white'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sources toggles */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-xs">
          <div className="flex items-center gap-2 min-w-[80px]">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">Source:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allSources.map((src) => {
              const isSelected = selectedSources.includes(src);
              return (
                <button
                  key={src}
                  onClick={() => toggleSourceFilter(src)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-border/20 border-border/40 text-muted-foreground hover:border-border hover:text-white'
                  }`}
                >
                  {getSourceIcon(src)}
                  <span>{src}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid listing container (Scrollable list) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-muted-foreground">Indexing graph node layers...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed border-border/60 rounded-xl bg-card/40 space-y-4">
            <Inbox className="w-10 h-10 text-muted-foreground" />
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white">No memories match your filter criteria</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                Try searching for keywords like 'launch', 'Cognito', 'pricing', 'AWS', or modify your source/category checkmarks.
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {results.map((item) => (
              <div
                key={item.id}
                onClick={() => openMemoryDetails(item.id)}
                className="group p-4 bg-card border border-border/60 hover:border-indigo-500/50 hover:bg-border/10 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getTypeStyles(item.type)}`}>
                      {item.type}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-border/25 border border-border/40 px-1.5 py-0.5 rounded">
                      {getSourceIcon(item.provenance.source)}
                      {item.provenance.source}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {item.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/40 mt-3.5 flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                  <span>Author: {item.provenance.author}</span>
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
