'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  HelpCircle,
  Mail,
  FolderKanban,
  FileText,
  CalendarDays,
  TrendingUp,
  Brain,
  CornerDownLeft,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { queryService, type AnswerPayload } from '@/services/queryService';
import type { SourceSystem } from '@/types';
import MemoryDetailPanel from '@/components/MemoryDetailPanel';

function prettyJson(value: unknown): string {
  try {
    const s = JSON.stringify(value, null, 2);
    return s.length > 2000 ? s.slice(0, 2000) + '\n…(truncated)' : s;
  } catch {
    return String(value);
  }
}

type Turn = { query: string; payload: AnswerPayload | null };

export default function AskFounderOps() {
  const [query, setQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const suggestedQuestions = [
    'Remember: we delayed launch a week due to 2 enterprise auth bugs.',
    "I'll send the investor update by Friday.",
    'What\'s on my Google Calendar this week?',
    'Summarize my latest 3 emails'
  ];

  // Restore prior conversation (survives navigation + refresh).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('founderops-ask-turns');
      if (saved) {
        const parsed = JSON.parse(saved) as Turn[];
        if (Array.isArray(parsed)) setTurns(parsed.filter((t) => t.payload));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist completed turns.
  useEffect(() => {
    try {
      const done = turns.filter((t) => t.payload);
      if (done.length) {
        localStorage.setItem('founderops-ask-turns', JSON.stringify(done));
      }
    } catch {
      // ignore
    }
  }, [turns]);

  // Auto-scroll to newest.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const handleAsk = async (text: string) => {
    if (!text.trim() || isThinking) return;
    setIsThinking(true);
    setQuery('');
    setTurns((prev) => [...prev, { query: text, payload: null }]);

    try {
      const result = await queryService.askQuestion(text);
      setTurns((prev) =>
        prev.map((t, i) => (i === prev.length - 1 ? { ...t, payload: result } : t))
      );
    } catch (err) {
      console.error('Failed to query FounderOps AI', err);
      setTurns((prev) =>
        prev.map((t, i) =>
          i === prev.length - 1
            ? {
                ...t,
                payload: {
                  answer: '⚠️ Something went wrong reaching the agent.',
                  sources: [],
                  relatedMemories: [],
                  suggestedQuestions: [],
                  toolCalls: [],
                  captured: 0
                }
              }
            : t
        )
      );
    } finally {
      setIsThinking(false);
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
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const openMemoryDetails = (id: string) => {
    setSelectedMemoryId(id);
    setIsPanelOpen(true);
  };

  const renderAnswer = (payload: AnswerPayload) => (
    <div className="space-y-7 animate-fade-in">
      {payload.captured > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>
            Captured {payload.captured} item{payload.captured === 1 ? '' : 's'} to your founder memory — view in Memory Explorer.
          </span>
        </div>
      )}

      {payload.sources.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5 font-bold">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Source Citations
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {payload.sources.map((src) => (
              <div
                key={src.id}
                onClick={() => openMemoryDetails(src.id)}
                className="p-3 bg-card border border-border/60 hover:border-indigo-500/50 hover:bg-border/10 rounded-lg cursor-pointer transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] bg-border px-1.5 py-0.5 rounded font-mono text-zinc-300">{src.type}</span>
                    {getSourceIcon(src.provenance.source)}
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{src.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{src.content}</p>
                </div>
                <div className="pt-2 border-t border-border/20 mt-2.5 flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                  <span className="truncate max-w-[80px]">{src.provenance.author}</span>
                  <span>{new Date(src.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-border pt-6">
        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Synthesized Answer
        </span>
        <div className="text-sm text-zinc-300 leading-relaxed space-y-4 select-text selection:bg-indigo-500/30">
          {payload.answer.split('\n\n').map((para, pIdx) => {
            if (para.startsWith('###')) {
              return <h4 key={pIdx} className="text-sm font-bold text-white mt-4">{para.replace('###', '')}</h4>;
            }
            if (para.startsWith('1.') || para.startsWith('-')) {
              return (
                <div key={pIdx} className="pl-4 border-l-2 border-indigo-500/40 space-y-2 my-2.5">
                  {para.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className="text-xs">{line}</p>
                  ))}
                </div>
              );
            }
            return <p key={pIdx} className="text-xs text-zinc-300">{para}</p>;
          })}
        </div>
      </div>

      {payload.relatedMemories.length > 0 && (
        <div className="space-y-2.5 border-t border-border pt-6">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Related Graph Nodes</span>
          <div className="flex flex-wrap gap-2">
            {payload.relatedMemories.map((rel) => (
              <button
                key={rel.id}
                onClick={() => openMemoryDetails(rel.id)}
                className="px-3 py-1.5 bg-border/20 border border-border/40 hover:border-border/80 hover:bg-border/30 rounded-lg text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-2"
              >
                {getSourceIcon(rel.provenance.source)}
                <span>{rel.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {payload.suggestedQuestions.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Suggested Follow-ups</span>
          <div className="space-y-2">
            {payload.suggestedQuestions.map((sQ, idx) => (
              <div
                key={idx}
                onClick={() => handleAsk(sQ)}
                className="p-3 bg-border/10 hover:bg-border/25 border border-border/30 hover:border-border/60 rounded-xl cursor-pointer text-xs text-zinc-300 hover:text-white font-medium transition-all duration-150 flex items-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{sQ}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Most recent turn that actually executed tools. We keep showing it even while
  // the next answer is loading, so the panel never flickers away between prompts.
  const toolTurn = [...turns].reverse().find((t) => t.payload && t.payload.toolCalls.length > 0);
  const latestToolCalls = toolTurn?.payload?.toolCalls ?? [];

  return (
    <div className="flex-1 flex flex-row min-h-0">
      <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full p-8 select-none text-foreground">
        {/* Top Banner Header */}
        <div className="border-b border-border pb-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-400 animate-pulse-subtle" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none mb-1">Ask FounderOps AI</h2>
              <p className="text-xs text-muted-foreground">Synthesize cross-platform records with full provenance citing.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {turns.length > 0 && (
              <button
                onClick={() => {
                  setTurns([]);
                  try { localStorage.removeItem('founderops-ask-turns'); } catch {}
                }}
                className="text-[10px] font-mono text-muted-foreground hover:text-white border border-border px-2.5 py-1 rounded uppercase tracking-wider transition-colors"
              >
                New chat
              </button>
            )}
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 rounded uppercase font-bold tracking-wider">
              RAG Engine: Synced
            </span>
          </div>
        </div>

        {/* Answer Area (Scrollable Center) */}
        <div className="flex-1 overflow-y-auto py-8 space-y-8 scrollbar-thin">
          {turns.length === 0 ? (
            <div className="max-w-xl mx-auto text-center space-y-8 py-12">
              <div className="space-y-3">
                <h3 className="text-xl font-extrabold text-white tracking-tight">What do you want to recover or capture?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tell it a decision, commitment, blocker, or metric to store it as structured memory — or ask it to act across your connected tools. Every answer cites real sources.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
                {suggestedQuestions.map((qText, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAsk(qText)}
                    className="p-4 bg-card border border-border/60 rounded-xl hover:border-border cursor-pointer hover:bg-border/20 transition-all duration-150 flex items-start gap-3 group"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-zinc-200 group-hover:text-white font-medium leading-tight">{qText}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {turns.map((turn, ti) => (
                <div key={ti} className="space-y-7">
                  {/* User prompt */}
                  <div className="flex items-start gap-4 p-4 bg-border/20 border border-border/30 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                      YOU
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">You asked</span>
                      <p className="text-sm font-semibold text-white">{turn.query}</p>
                    </div>
                  </div>

                  {/* Answer / thinking */}
                  {!turn.payload ? (
                    <div className="space-y-4 p-4">
                      <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>FounderOps AI is reading memories, running tools, and verifying citations...</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="h-3 bg-border/40 rounded-full w-3/4 animate-pulse" />
                        <div className="h-3 bg-border/40 rounded-full w-5/6 animate-pulse" />
                        <div className="h-3 bg-border/40 rounded-full w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    renderAnswer(turn.payload)
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Query input panel */}
        <div className="pt-4 border-t border-border bg-background shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleAsk(query); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isThinking}
              placeholder="Tell it a decision/commitment, or ask it to act on your tools..."
              className="w-full bg-card border border-border/75 rounded-xl py-4 pl-5 pr-28 text-xs text-white focus:outline-none focus:border-indigo-500/75 transition-colors placeholder:text-muted-foreground shadow-inner"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <span className="hidden md:flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                Enter <CornerDownLeft className="w-2.5 h-2.5 text-muted-foreground inline" />
              </span>
              <button
                type="submit"
                disabled={isThinking || !query.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2 transition-all shadow-md disabled:bg-border/40 disabled:text-muted-foreground disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tool Execution panel (right rail) - always present, persists between prompts */}
      <aside className="hidden lg:flex w-[360px] shrink-0 flex-col border-l border-border bg-background/40 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold text-white">Tool Execution</span>
          {isThinking ? (
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> running…
            </span>
          ) : (
            <span className="ml-auto rounded bg-border/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {latestToolCalls.length} call{latestToolCalls.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="space-y-3 p-3">
          {latestToolCalls.length === 0 ? (
            <div className="mt-6 px-4 text-center">
              <Terminal className="mx-auto h-6 w-6 text-border" />
              <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                Live tool calls appear here. Ask FounderOps to check your email, calendar, or Slack and you&apos;ll
                see each tool, its arguments, and its result.
              </p>
            </div>
          ) : (
            latestToolCalls.map((tc, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
                <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate font-mono text-[11px] font-bold text-white">{tc.name}</span>
                </div>
                <div className="space-y-2 px-3 py-2">
                  <div>
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">Args</span>
                    <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-all rounded bg-background/60 p-1.5 text-[10px] text-zinc-300">{prettyJson(tc.args)}</pre>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">Result</span>
                    <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded bg-background/60 p-1.5 text-[10px] text-zinc-400">{prettyJson(tc.result)}</pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <MemoryDetailPanel
        memoryId={selectedMemoryId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNavigateToMemory={(id) => openMemoryDetails(id)}
      />
    </div>
  );
}
