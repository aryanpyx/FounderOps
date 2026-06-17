'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Network,
  History,
  AlertOctagon,
  TrendingUp,
  CheckSquare,
  Sparkles,
  Clock,
  ShieldCheck,
  Lock,
  ScrollText,
  KeyRound,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════
   FounderOps landing — a scroll-cinematic: the founder's struggle (scattered,
   forgotten context) → FounderOps captures it → clarity & success.
   Dark, minimal, techy blue. Warm orange pop on the closing CTA.
   ════════════════════════════════════════════════════════════════════ */

const GRAD =
  'bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-[fo-gradient_6s_ease_infinite]';

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
      <span className="ml-0.5 inline-block w-[3px] -translate-y-1 animate-pulse rounded-full bg-gradient-to-b from-blue-400 to-cyan-300 align-middle" style={{ height: '0.9em' }} />
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

/* ── Count-up stat ── */
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

const RECORDS = [
  { icon: Zap, label: 'Decision', text: 'Launch pushed to July 5', tint: 'text-blue-300 border-blue-500/40 bg-blue-500/10' },
  { icon: AlertOctagon, label: 'Blocker', text: 'Stripe webhooks not firing', tint: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
  { icon: CheckSquare, label: 'Commitment', text: 'Investor update by Friday', tint: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
  { icon: TrendingUp, label: 'Metric', text: 'MRR +21% to $5,100', tint: 'text-sky-300 border-sky-500/40 bg-sky-500/10' },
];

// Scattered "lost context" thoughts for the struggle scene.
const CHAOS = [
  { t: 'what did we decide on pricing?', x: '-58%', y: '-30%', r: -8 },
  { t: 'that Slack thread from Tuesday…', x: '42%', y: '-38%', r: 7 },
  { t: 'who owns the investor update?', x: '-46%', y: '28%', r: 6 },
  { t: 'the metric from the call?', x: '50%', y: '24%', r: -6 },
  { t: 'why did we delay launch again?', x: '-8%', y: '-46%', r: 3 },
  { t: 'buried in an email somewhere', x: '6%', y: '40%', r: -4 },
];

const FEATURES = [
  { icon: History, title: 'Decision Recovery', body: 'Ask "why did we decide X?" months later — get the real reasoning, with citations.', chip: 'bg-blue-500/15 text-blue-300 ring-blue-400/20' },
  { icon: Sparkles, title: 'Daily Brief & Weekly Review', body: 'One click syncs your tools and synthesizes an opinionated, priority-grouped brief.', chip: 'bg-sky-500/15 text-sky-300 ring-sky-400/20' },
  { icon: Network, title: 'Memory Graph', body: 'Records auto-link into a navigable graph — decisions tied to their blockers and metrics.', chip: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/20' },
  { icon: Clock, title: 'Proactive Nudges', body: 'Flags overdue commitments and lingering blockers before they bite — your AI chief of staff.', chip: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/20' },
];

const SECURITY = [
  { icon: ShieldCheck, title: 'OAuth — never your keys', body: 'The agent never sees a password or API key. Composio brokers every connection, and you revoke any app in one click.' },
  { icon: Lock, title: 'Sandboxed execution', body: "Every tool call runs in an isolated remote sandbox that's wiped when the task ends." },
  { icon: ScrollText, title: 'Full provenance & audit', body: 'Every record links back to its source message. Every action is logged — you see what ran, and why.' },
  { icon: KeyRound, title: 'Your data, your database', body: 'Memory lives in your own Postgres. Disconnect a source and ingestion stops instantly.' },
];

/* ── The struggle → success transformation (scroll-pinned) ── */
function TransformScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const chaosOpacity = useTransform(scrollYProgress, [0, 0.38], [1, 0]);
  const chaosScale = useTransform(scrollYProgress, [0, 0.38], [1, 0.6]);
  const beforeText = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const captureText = useTransform(scrollYProgress, [0.32, 0.45, 0.6, 0.7], [0, 1, 1, 0]);
  const orderOpacity = useTransform(scrollYProgress, [0.55, 0.85], [0, 1]);
  const orderScale = useTransform(scrollYProgress, [0.55, 0.9], [0.9, 1]);
  const afterText = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);

  return (
    <section ref={ref} className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-5">
        {/* Stage labels */}
        <motion.span style={{ opacity: beforeText }} className="absolute top-[16%] font-mono text-xs uppercase tracking-[0.3em] text-rose-400/80">
          Before — context, everywhere and nowhere
        </motion.span>
        <motion.span style={{ opacity: captureText }} className="absolute top-[16%] font-mono text-xs uppercase tracking-[0.3em] text-sky-400">
          FounderOps captures it all
        </motion.span>
        <motion.span style={{ opacity: afterText }} className="absolute top-[16%] font-mono text-xs uppercase tracking-[0.3em] text-emerald-400">
          After — typed, sourced, recalled
        </motion.span>

        {/* Chaos layer */}
        <motion.div style={{ opacity: chaosOpacity, scale: chaosScale }} className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {CHAOS.map((c, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute max-w-[200px] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs italic text-zinc-500"
              style={{ transform: `translate(${c.x}, ${c.y}) rotate(${c.r}deg)` }}
            >
              {c.t}
            </motion.div>
          ))}
        </motion.div>

        {/* Order layer */}
        <motion.div style={{ opacity: orderOpacity, scale: orderScale }} className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {RECORDS.map((r) => (
            <div key={r.label} className={`flex items-start gap-2.5 rounded-xl border p-4 ${r.tint}`}>
              <r.icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide">{r.label}</span>
                <p className="text-sm text-zinc-100">{r.text}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-[#07090e] font-sans text-white antialiased">
      <style>{`
        @keyframes fo-gradient { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes fo-spin { from{transform:translateX(-50%) rotate(0deg)} to{transform:translateX(-50%) rotate(360deg)} }
        @keyframes fo-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* depth */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.10] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      <div className="pointer-events-none fixed left-[-8%] top-[-12%] -z-10 h-[520px] w-[620px] rounded-full bg-blue-600/15 blur-[150px]" />
      <div className="pointer-events-none fixed bottom-[-12%] right-[-8%] -z-10 h-[460px] w-[560px] rounded-full bg-cyan-500/10 blur-[150px]" />
      <div className="pointer-events-none fixed left-1/2 top-[2%] -z-10 h-[620px] w-[620px] rounded-full opacity-20 blur-[100px] [animation:fo-spin_24s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #22d3ee, #38bdf8, #60a5fa, #3b82f6)' }} />

      {/* ── Nav (Apple-style) ── */}
      <header className="fixed inset-x-0 top-0 z-50 h-12 border-b border-white/[0.08] bg-[#0a0d14]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="relative mx-auto flex h-full max-w-5xl items-center justify-between px-6">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="FounderOps" className="h-6 w-auto opacity-90 invert mix-blend-screen" />
          </Link>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-[12px] font-medium tracking-wide text-white/70 sm:flex">
            <a href="#story" className="transition-colors hover:text-white">Story</a>
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#security" className="transition-colors hover:text-white">Security</a>
          </nav>
          <Link href="/login" className="shrink-0 text-[12px] font-medium text-white/70 transition-colors hover:text-white">
            Launch app
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-5xl px-5 pb-24 pt-36 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-zinc-300">
            <Sparkles className="h-3 w-3 text-sky-400" /> The memory layer for founders
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl md:text-7xl">
            Never lose a{' '}
            <Typewriter words={['decision', 'commitment', 'blocker', 'metric']} />
            <br className="hidden sm:block" /> again.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            FounderOps reads your email, Slack, calendar — and <span className="text-zinc-200">1,000+ other apps</span> —
            and turns the noise into typed, sourced memory you can actually recall.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/60">
              Launch app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#story" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06]">
              See the story
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── The struggle (intro) ── */}
      <section id="story" className="mx-auto max-w-3xl px-5 pt-16 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Every founder is <span className="text-rose-400">drowning in context.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-zinc-400">
            Decisions in Slack. Commitments in email. Metrics on a call. Blockers in someone&apos;s head. Six weeks
            later, nobody remembers <span className="italic text-zinc-300">why</span> — and it&apos;s gone.
          </p>
        </Reveal>
      </section>

      {/* ── The transformation (scroll-pinned cinematic) ── */}
      <TransformScene />

      {/* ── The win ── */}
      <section className="mx-auto max-w-5xl px-5 py-12 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Then a founder runs <span className={GRAD}>FounderOps.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-zinc-400">
            The noise becomes structured memory — captured automatically, linked into a graph, recalled in one click.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { n: <Counter to={4} />, label: 'typed records from a single email' },
            { n: <><Counter to={0} /></>, label: 'decisions lost to a forgotten thread' },
            { n: <Counter to={1000} suffix="+" />, label: 'apps it can read, via Composio' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
                <div className={`text-5xl font-bold ${GRAD}`}>{s.n}</div>
                <p className="mt-3 text-sm text-zinc-400">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 0.1}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-blue-500/30">
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

      {/* ── Security ── */}
      <section id="security" className="mx-auto max-w-5xl px-5 py-16">
        <Reveal className="text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">Trust &amp; security</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Your ideas <span className={GRAD}>stay yours.</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Founders hand FounderOps their most sensitive strategy. So it&apos;s built so the AI never holds the keys — and you can pull the plug any time.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SECURITY.map((s, i) => (
            <Reveal key={s.title} delay={(i % 2) * 0.1}>
              <div className="h-full rounded-2xl bg-gradient-to-br from-emerald-500/40 via-white/10 to-transparent p-px transition-transform hover:-translate-y-0.5">
                <div className="flex h-full gap-4 rounded-2xl bg-[#0a0d10] p-6">
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

      {/* ── CTA (warm) ── */}
      <section className="mx-auto max-w-5xl px-5 py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/20 via-[#120c08] to-orange-600/20 px-6 py-16 text-center">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-amber-500/25 blur-[100px]" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-5xl">
              Stop losing the{' '}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">&ldquo;why&rdquo;.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-zinc-300">
              Build your startup&apos;s institutional memory — automatically, with full provenance.
            </p>
            <Link href="/login" className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50">
              Launch FounderOps
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FounderOps" className="h-7 w-auto invert mix-blend-screen" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">The memory layer for founders · built on TrustClaw + Composio</p>
          <Link href="/login" className="text-sm font-medium text-zinc-300 transition-colors hover:text-white">Launch app →</Link>
        </div>
      </footer>
    </div>
  );
}
