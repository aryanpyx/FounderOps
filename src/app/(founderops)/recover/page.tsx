'use client';

import React, { useState } from 'react';
import { History, Send, Sparkles } from 'lucide-react';
import { BriefMarkdown } from '@/components/BriefMarkdown';

const EXAMPLES = [
  'Why did we raise pricing?',
  'Why is billing blocked?',
  'What was the reasoning behind our last launch decision?',
];

export default function DecisionRecovery() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);

  const recover = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    setAsked(q);
    try {
      const res = await fetch('/api/founderops/engine/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      setAnswer(data.answer ?? data.error ?? 'No reasoning could be reconstructed.');
    } catch {
      setAnswer('⚠️ Could not run decision recovery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full text-foreground">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
          <History className="w-3.5 h-3.5" />
          Institutional Memory
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white">Decision Recovery</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Reconstruct <span className="text-indigo-300">why</span> a past decision was made — the blockers and metrics
          that drove it, with citations from your typed memory.
        </p>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); recover(question); }}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          placeholder="Why did we…?"
          className="w-full bg-card border border-border/75 rounded-xl py-4 pl-5 pr-16 text-sm text-white focus:outline-none focus:border-indigo-500/75 transition-colors placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2 transition-all disabled:bg-border/40 disabled:text-muted-foreground"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Example chips */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setQuestion(ex); recover(ex); }}
              className="px-3 py-1.5 bg-border/20 border border-border/40 hover:border-indigo-500/40 hover:text-white rounded-lg text-xs text-muted-foreground transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Answer */}
      {(loading || answer) && (
        <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {asked ? `Recovering: "${asked}"` : 'Decision Recovery'}
          </div>
          {loading ? (
            <div className="space-y-2.5 pt-1">
              <div className="h-3 bg-border/40 rounded-full w-3/4 animate-pulse" />
              <div className="h-3 bg-border/40 rounded-full w-5/6 animate-pulse" />
              <div className="h-3 bg-border/40 rounded-full w-2/3 animate-pulse" />
            </div>
          ) : (
            answer && <BriefMarkdown text={answer} />
          )}
        </div>
      )}
    </div>
  );
}
