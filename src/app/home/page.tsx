'use client';

import React from 'react';
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
  Play,
  Sparkles,
} from 'lucide-react';
import { FounderOpsLogo } from '@/components/FounderOpsLogo';

/* Scroll-reveal wrapper */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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
  { icon: Zap, label: 'Decision', text: 'Public launch pushed to July 5', color: 'text-indigo-400', ring: 'border-indigo-500/30 bg-indigo-500/[0.06]' },
  { icon: AlertOctagon, label: 'Blocker', text: 'Stripe billing webhooks not firing', color: 'text-rose-400', ring: 'border-rose-500/30 bg-rose-500/[0.06]' },
  { icon: CheckSquare, label: 'Commitment', text: 'Send revised timeline to investors by Friday', color: 'text-emerald-400', ring: 'border-emerald-500/30 bg-emerald-500/[0.06]' },
  { icon: TrendingUp, label: 'Metric', text: 'MRR grew 21% to $5,100', color: 'text-amber-400', ring: 'border-amber-500/30 bg-amber-500/[0.06]' },
];

const BENEFITS = [
  { icon: History, title: 'Decision Recovery', body: 'Ask "why did we decide X?" and get the real reasoning back — the blockers and metrics that drove it, with citations.' },
  { icon: Sparkles, title: 'Daily Brief & Weekly Review', body: 'One click syncs your tools, then synthesizes an opinionated brief from your memory — priority-grouped, no filler.' },
  { icon: Network, title: 'Memory Graph', body: 'Records auto-link into a navigable knowledge graph, so every decision connects to the blockers and metrics behind it.' },
];

const STACK = ['NVIDIA NIM', 'Google Gemini', 'Composio', 'Next.js 15', 'Postgres + pgvector'];

export default function Home() {
  return (
    <div className="dark min-h-screen overflow-x-hidden bg-[#070708] text-white antialiased">
      {/* ───────── Nav ───────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#070708]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <FounderOpsLogo size="sm" />
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#demo" className="transition-colors hover:text-white">Demo</a>
          </nav>
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
          >
            Launch app
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24 pt-40 text-center">
        {/* gradient glow */}
        <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute left-1/2 top-48 -z-10 h-[320px] w-[420px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            The memory layer for founders
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Your startup&apos;s memory,{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              built automatically.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            FounderOps reads your email, calendar, Slack and chat, and turns the noise into{' '}
            <span className="text-zinc-200">typed, sourced memory</span> — every decision, commitment,
            blocker and metric. Never lose the &ldquo;why&rdquo; in a thread again.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
            >
              Launch app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06]"
            >
              See how it works
            </a>
          </div>
        </motion.div>

        {/* Floating extraction preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-16 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 text-xs text-zinc-400">
            <Mail className="h-4 w-4 text-rose-400" />
            <span className="font-mono">1 email → 4 typed memories</span>
          </div>
          <p className="py-4 text-sm italic text-zinc-400">
            &ldquo;We&apos;re pushing launch to July 5 because Stripe billing is blocked; I&apos;ll
            update investors Friday; MRR is up 21% to $5.1k.&rdquo;
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RECORDS.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                className={`flex items-start gap-2.5 rounded-lg border p-3 ${r.ring}`}
              >
                <r.icon className={`mt-0.5 h-4 w-4 shrink-0 ${r.color}`} />
                <div className="min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${r.color}`}>{r.label}</span>
                  <p className="text-xs text-zinc-200">{r.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────── Powered by ───────── */}
      <Reveal className="mx-auto max-w-5xl px-5 py-10">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
          Runs on free, no-card infrastructure
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {STACK.map((s) => (
            <span key={s} className="text-sm font-semibold text-zinc-400">{s}</span>
          ))}
        </div>
      </Reveal>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The memory builds itself.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            A daily engine pulls your activity, separates signal from noise, and distills it into
            structured records — linked, sourced, and searchable.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { n: '01', t: 'Ingest', d: 'Pulls fresh activity from Gmail, Calendar, Slack and Notion through Composio — OAuth-brokered and sandboxed.' },
            { n: '02', t: 'Extract', d: 'A signal filter drops the noise; the engine extracts Decisions, Commitments, Blockers and Metrics with full provenance.' },
            { n: '03', t: 'Connect', d: 'Records auto-link into a knowledge graph, then surface as briefs, weekly reviews, and decision recovery.' },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <span className="font-mono text-sm text-indigo-400">{step.n}</span>
                <h3 className="mt-3 text-lg font-bold">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Features / benefits ───────── */}
      <section id="features" className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.1}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-indigo-500/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 ring-1 ring-inset ring-white/10">
                  <b.icon className="h-5 w-5 text-indigo-300" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Architecture ───────── */}
      <section className="mx-auto max-w-5xl px-5 py-24">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">One pipeline, end to end.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            From your connected tools to typed memory and back — secured by TrustClaw, brokered by Composio.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arch.png" alt="FounderOps architecture" className="mx-auto w-full max-w-3xl" />
          </div>
        </Reveal>
      </section>

      {/* ───────── Demo / video slot ───────── */}
      <section id="demo" className="mx-auto max-w-5xl px-5 py-12">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Watch it work.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            See a real email become four linked memories — no manual entry.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          {/*
            VIDEO SLOT — drop the demo video here when it's ready, e.g.:
            <video src="/demo.mp4" controls poster="/demo-poster.png" className="h-full w-full rounded-2xl" />
            or an embed (YouTube/Loom iframe).
          */}
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-600/10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_60%)]" />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur">
                <Play className="h-6 w-6 fill-white text-white" />
              </div>
              <span className="text-sm font-medium text-zinc-300">Demo video coming soon</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── CTA band ───────── */}
      <section className="mx-auto max-w-5xl px-5 py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-[#0c0c10] to-purple-600/20 px-6 py-16 text-center">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[100px]" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              Stop losing the &ldquo;why&rdquo;.
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
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
          <FounderOpsLogo size="sm" />
          <p className="text-xs text-zinc-500">
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
