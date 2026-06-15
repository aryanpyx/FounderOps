'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  Zap,
  Network,
  History,
  AlertOctagon,
  TrendingUp,
  CheckSquare,
  Sparkles,
  Clock,
  Quote,
  ShieldCheck,
  Lock,
  ScrollText,
  KeyRound,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════
   FounderOps landing — dark, warm, characterful. Rotating conic orb,
   flowing gradient type, grain for depth, and multi-color cards.
   ════════════════════════════════════════════════════════════════════ */

// Flowing warm→cool gradient (animated background-position).
const GRAD =
  'bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[fo-gradient_6s_ease_infinite]';

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

/* ── Typewriter ── */
function Typewriter({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [sub, setSub] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const word = words[i % words.length] ?? '';
    if (!del && sub === word.length) {
      const t = setTimeout(() => setDel(true), 1500);
      return () => clearTimeout(t);
    }
    if (del && sub === 0) {
      setDel(false);
      setI((p) => (p + 1) % words.length);
      return;
    }
    const t = setTimeout(() => setSub((s) => s + (del ? -1 : 1)), del ? 45 : 85);
    return () => clearTimeout(t);
  }, [sub, del, i, words]);

  const word = words[i % words.length] ?? '';
  return (
    <span className="relative whitespace-nowrap">
      <span className={GRAD}>{word.slice(0, sub)}</span>
      <span
        className="ml-0.5 inline-block w-[3px] -translate-y-1 animate-pulse rounded-full bg-gradient-to-b from-amber-300 to-rose-400 align-middle"
        style={{ height: '0.9em' }}
      />
    </span>
  );
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.5, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const RECORDS = [
  { icon: Zap, label: 'Decision', text: 'Public launch pushed to July 5', tint: 'text-violet-300 border-violet-500/30 bg-violet-500/[0.07]' },
  { icon: AlertOctagon, label: 'Blocker', text: 'Stripe billing webhooks not firing', tint: 'text-rose-300 border-rose-500/30 bg-rose-500/[0.07]' },
  { icon: CheckSquare, label: 'Commitment', text: 'Send timeline to investors by Friday', tint: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/[0.07]' },
  { icon: TrendingUp, label: 'Metric', text: 'MRR grew 21% to $5,100', tint: 'text-amber-300 border-amber-500/30 bg-amber-500/[0.07]' },
];

// Each card gets its own hue — the modern multi-color dashboard look.
const FEATURES = [
  { icon: History, title: 'Decision Recovery', body: 'Ask "why did we decide X?" months later and get the real reasoning — with citations.', chip: 'bg-amber-500/15 text-amber-300 ring-amber-400/20', glow: 'bg-amber-500/20', border: 'hover:border-amber-500/40' },
  { icon: Sparkles, title: 'Daily Brief & Weekly Review', body: 'One click syncs your tools and synthesizes an opinionated, priority-grouped brief.', chip: 'bg-orange-500/15 text-orange-300 ring-orange-400/20', glow: 'bg-orange-500/20', border: 'hover:border-orange-500/40' },
  { icon: Network, title: 'Memory Graph', body: 'Records auto-link into a navigable graph — decisions tied to their blockers and metrics.', chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20', glow: 'bg-emerald-500/20', border: 'hover:border-emerald-500/40' },
  { icon: Clock, title: 'Passive ingest', body: 'A daily engine pulls activity, filters noise, and extracts typed records — automatically.', chip: 'bg-sky-500/15 text-sky-300 ring-sky-400/20', glow: 'bg-sky-500/20', border: 'hover:border-sky-500/40' },
];

const STEPS = [
  { n: '01', t: 'Ingest', d: 'Pulls fresh activity from Gmail, Slack, Calendar, Notion and 1,000+ apps through Composio — OAuth-brokered, sandboxed.', num: 'text-amber-400' },
  { n: '02', t: 'Extract', d: 'A signal filter drops the noise; the engine extracts Decisions, Commitments, Blockers and Metrics with provenance.', num: 'text-rose-400' },
  { n: '03', t: 'Connect', d: 'Records auto-link into a knowledge graph, then surface as briefs, weekly reviews, and decision recovery.', num: 'text-sky-400' },
];

const SECURITY = [
  { icon: ShieldCheck, title: 'OAuth — never your keys', body: 'The agent never sees a password or API key. Composio brokers every connection over OAuth, and you revoke any app in one click.' },
  { icon: Lock, title: 'Sandboxed execution', body: "Every tool call runs in an isolated remote sandbox that's wiped when the task ends. Nothing executes on your machine." },
  { icon: ScrollText, title: 'Full provenance & audit', body: 'Every record links back to the exact email or message it came from. Every action is logged — you see what ran, and why.' },
  { icon: KeyRound, title: 'Your data, your database', body: 'Memory lives in your own Postgres. Disconnect a source and ingestion stops instantly. No lock-in, no surprises.' },
];

export default function Home() {
  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-[#0a0809] font-sans text-white antialiased">
      <style>{`
        @keyframes fo-gradient { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes fo-spin { from{transform:translateX(-50%) rotate(0deg)} to{transform:translateX(-50%) rotate(360deg)} }
        @keyframes fo-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* depth: grain + warm/cool glows + rotating conic orb */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      <div className="pointer-events-none fixed left-[-8%] top-[-12%] -z-10 h-[520px] w-[620px] rounded-full bg-amber-500/15 blur-[150px]" />
      <div className="pointer-events-none fixed bottom-[-12%] right-[-8%] -z-10 h-[460px] w-[560px] rounded-full bg-violet-600/15 blur-[150px]" />
      <div
        className="pointer-events-none fixed left-1/2 top-[2%] -z-10 h-[620px] w-[620px] rounded-full opacity-25 blur-[90px] [animation:fo-spin_22s_linear_infinite]"
        style={{ background: 'conic-gradient(from 0deg, #f59e0b, #fb7185, #a855f7, #38bdf8, #f59e0b)' }}
      />

      {/* ───────── Nav ───────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0a0809]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FounderOps" className="h-12 w-auto invert" />
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
          </nav>
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/40"
          >
            Launch app
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative mx-auto max-w-5xl px-5 pb-24 pt-44 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-zinc-300">
            <Sparkles className="h-3 w-3 text-amber-400" /> The memory layer for founders
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl md:text-7xl">
            Never lose a{' '}
            <Typewriter words={['decision', 'commitment', 'blocker', 'metric']} />
            <br className="hidden sm:block" /> again.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            FounderOps reads your email, Slack, calendar — and{' '}
            <span className="text-zinc-200">1,000+ other apps</span> — and turns the noise into typed, sourced
            memory you can actually recall.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-rose-500/25 transition-all hover:shadow-rose-500/50"
            >
              Launch app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06]">
              See how it works
            </a>
          </div>
        </motion.div>

        {/* email → memories showcase (gently floating) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-16 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left shadow-[0_0_90px_-20px_rgba(251,191,36,0.35)] backdrop-blur [animation:fo-float_7s_ease-in-out_infinite]"
        >
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs text-zinc-400">
            <Mail className="h-4 w-4 text-rose-400" /> 1 email → 4 typed memories
          </div>
          <p className="flex gap-2 py-4 text-sm italic text-zinc-400">
            <Quote className="h-4 w-4 shrink-0 text-zinc-600" />
            We&apos;re pushing launch to July 5 because Stripe billing is blocked; I&apos;ll update investors
            Friday; MRR is up 21% to $5.1k.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RECORDS.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.12 }}
                className={`flex items-start gap-2.5 rounded-lg border p-3 ${r.tint}`}
              >
                <r.icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wide">{r.label}</span>
                  <p className="text-xs text-zinc-200">{r.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            The memory <span className={GRAD}>builds itself.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            A daily engine pulls your activity, separates signal from noise, and distills it into structured,
            linked records.
          </p>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04]">
                <span className={`font-mono text-sm ${s.num}`}>{s.n}</span>
                <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Features (multi-color) ───────── */}
      <section id="features" className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 0.1}>
              <div className={`group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all ${f.border}`}>
                <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-100 ${f.glow}`} />
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${f.chip}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Security / trust ───────── */}
      <section id="security" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal className="text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">Trust &amp; security</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Your ideas <span className={GRAD}>stay yours.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Founders hand FounderOps their most sensitive strategy. So it&apos;s built so the AI never holds the
            keys — and you can pull the plug any time.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SECURITY.map((s, i) => (
            <Reveal key={s.title} delay={(i % 2) * 0.1}>
              {/* gradient-bordered "special" card */}
              <div className="h-full rounded-2xl bg-gradient-to-br from-emerald-500/40 via-white/10 to-transparent p-px transition-transform hover:-translate-y-0.5">
                <div className="flex h-full gap-4 rounded-2xl bg-[#0b0a0b] p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="mx-auto max-w-5xl px-5 py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/15 via-[#100b0c] to-violet-600/15 px-6 py-16 text-center">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-amber-500/20 blur-[100px]" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-5xl">
              Stop losing the <span className={GRAD}>&ldquo;why&rdquo;.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-zinc-300">
              Build your startup&apos;s institutional memory — automatically, with full provenance.
            </p>
            <Link
              href="/login"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
            >
              Launch FounderOps
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FounderOps" className="h-10 w-auto invert" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            The memory layer for founders · built on TrustClaw + Composio
          </p>
          <Link href="/login" className="text-sm font-medium text-zinc-300 transition-colors hover:text-white">
            Launch app →
          </Link>
        </div>
      </footer>
    </div>
  );
}
