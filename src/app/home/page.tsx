'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════
   FounderOps landing — editorial / Swiss design in the 0.xyz mould:
   light #FAFAF8 canvas, orbital SVG, curved-network CTA, alternating
   gradient statement type, and a giant purple-gradient footer.
   ════════════════════════════════════════════════════════════════════ */

const GRADIENT = 'bg-gradient-to-r from-[#173A73] via-[#4F67D8] to-[#B7A8FF] bg-clip-text text-transparent';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.5, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Wordmark (logo glyph + name), matches the app brand ── */
function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" className="h-7 w-auto" />
      <span className="text-[15px] font-medium tracking-tight text-[#111]">FounderOps</span>
    </div>
  );
}

function LaunchButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/login"
      className={`group inline-flex items-center gap-2 rounded-[3px] bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 ${className}`}
    >
      Launch app
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ── Orbital SVG (left hero graphic) ── */
function Orbital() {
  return (
    <svg viewBox="0 0 480 480" className="h-full w-full" fill="none">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="22%" stopColor="#9DA9FF" />
          <stop offset="55%" stopColor="#2C3F86" />
          <stop offset="100%" stopColor="#2C3F86" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="240" r="120" fill="url(#glow)" opacity="0.9" />
      {[120, 185, 250, 315].map((r) => (
        <circle key={r} cx="150" cy="240" r={r} stroke="#C9C9C9" strokeWidth="1" />
      ))}
      <circle cx="150" cy="240" r="280" stroke="#D7D7D7" strokeWidth="1" strokeDasharray="2 5" />
      {/* nodes */}
      <rect x="262" y="172" width="9" height="9" stroke="#9A9A9A" fill="#FAFAF8" />
      <rect x="146" y="-5" width="9" height="9" stroke="#9A9A9A" fill="#FAFAF8" />
      <circle cx="150" cy="55" r="4" stroke="#9A9A9A" fill="#FAFAF8" />
      <circle cx="430" cy="240" r="4" stroke="#9A9A9A" fill="#FAFAF8" />
      <polygon points="208,300 216,300 212,293" stroke="#9A9A9A" fill="#FAFAF8" />
      {/* tiny labels */}
      <text x="285" y="160" fontSize="10" fill="#A8A8A8" fontFamily="monospace">GMAIL</text>
      <text x="60" y="40" fontSize="10" fill="#A8A8A8" fontFamily="monospace">SLACK</text>
      <text x="300" y="300" fontSize="10" fill="#A8A8A8" fontFamily="monospace">NOTION</text>
      <text x="20" y="300" fontSize="10" fill="#A8A8A8" fontFamily="monospace">CALENDAR</text>
    </svg>
  );
}

/* ── Curved network behind the statement CTA ── */
function CurvedNetwork() {
  const paths = [
    'M0,40 C360,40 440,200 600,200',
    'M0,200 L600,200',
    'M0,360 C360,360 440,200 600,200',
    'M1200,40 C840,40 760,200 600,200',
    'M1200,200 L600,200',
    'M1200,360 C840,360 760,200 600,200',
  ];
  const dotted = ['M0,110 C380,110 420,200 600,200', 'M1200,110 C820,110 780,200 600,200', 'M0,290 C380,290 420,200 600,200', 'M1200,290 C820,290 780,200 600,200'];
  return (
    <svg viewBox="0 0 1200 400" className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid meet">
      {paths.map((d, i) => (
        <path key={i} d={d} stroke="#D2D2D2" strokeWidth="1" />
      ))}
      {dotted.map((d, i) => (
        <path key={`d${i}`} d={d} stroke="#D2D2D2" strokeWidth="1" strokeDasharray="2 5" />
      ))}
      <rect x="-4" y="36" width="8" height="8" stroke="#9A9A9A" fill="#FAFAF8" />
      <rect x="1196" y="356" width="8" height="8" stroke="#9A9A9A" fill="#FAFAF8" />
      <circle cx="0" cy="200" r="4" stroke="#9A9A9A" fill="#FAFAF8" />
      <circle cx="1200" cy="200" r="4" stroke="#9A9A9A" fill="#FAFAF8" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans text-[#111] antialiased">
      {/* ───────── Navbar ───────── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FAFAF8]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark />
          <div className="flex items-center gap-7">
            <a href="#how" className="hidden text-xs font-medium uppercase tracking-wider text-[#555] transition-colors hover:text-black sm:block">
              How it works
            </a>
            <LaunchButton />
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-28 pt-40 text-center">
        {/* faint scattered source labels */}
        <div className="pointer-events-none absolute inset-0 select-none font-mono text-[10px] uppercase tracking-widest text-[#C9C9C9]">
          <span className="absolute left-[12%] top-[22%]">Gmail</span>
          <span className="absolute right-[14%] top-[18%]">Notion</span>
          <span className="absolute left-[20%] bottom-[26%]">Calendar</span>
          <span className="absolute right-[18%] bottom-[30%]">Slack</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FounderOps" className="mx-auto mb-10 h-28 w-auto" />

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-7xl">
            Your startup&apos;s <span className={GRADIENT}>record of truth.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[#555] sm:text-lg">
            Every decision, commitment, blocker and metric — captured from your tools, sourced with full
            provenance, and recalled in one click.
          </p>

          <div className="mt-9 flex items-center justify-center">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-[3px] bg-black px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
            >
              Launch app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ───────── Feature: orbital + copy ───────── */}
      <section id="how" className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-24 md:grid-cols-2">
        <Reveal className="relative mx-auto aspect-square w-full max-w-md">
          <Orbital />
        </Reveal>

        <Reveal delay={0.1} className="relative">
          <span className="mb-5 block -rotate-3 font-mono text-xs uppercase tracking-[0.2em] text-[#999]">
            ● One email → four typed memories
          </span>
          <p className="text-2xl font-medium leading-snug tracking-tight text-[#1a1a1a] sm:text-[28px]">
            FounderOps reads your email, calendar, Slack and Notion and distills the signal into typed
            records — <span className="text-[#4F67D8]">Decisions, Commitments, Blockers, Metrics</span> — each
            with full provenance. Ask <span className="italic">&ldquo;why did we decide X?&rdquo;</span> months
            later and get the real answer.
          </p>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-[#999]">Connected sources</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {['Gmail', 'Calendar', 'Slack', 'Notion'].map((s) => (
              <span key={s} className="rounded-full border border-[#E2E2DE] bg-white px-4 py-1.5 text-sm font-medium text-[#333] shadow-sm">
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ───────── Statement + curved network ───────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-28">
        <Reveal className="text-center">
          <h2 className="text-4xl font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-7xl">
            Sourced. <span className={GRADIENT}>Linked.</span>
            <br />
            Recalled. <span className={GRADIENT}>Automatically.</span>
          </h2>
        </Reveal>

        <div className="relative mt-16 h-64 w-full sm:h-72">
          <CurvedNetwork />
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-[3px] bg-black px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-xl transition-colors hover:bg-zinc-800"
            >
              Launch app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Footer / newsletter ───────── */}
      <footer
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(180deg, #D9C5FF 0%, #9D84FF 35%, #4A63D8 70%, #071528 100%)' }}
      >
        <div className="mx-auto max-w-6xl px-6 pt-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h3 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Get the FounderOps memo.
              </h3>
              <form className="mt-8 flex max-w-md items-center gap-3 border-b border-white/40 pb-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
                />
                <button type="submit" className="shrink-0 text-xs font-semibold uppercase tracking-wider text-white">
                  Sign up
                </button>
              </form>
            </div>

            <div className="grid grid-cols-2 gap-8 text-[13px] sm:grid-cols-3">
              <div className="space-y-3">
                <p className="font-semibold uppercase tracking-wider">Product</p>
                <Link href="/login" className="block text-white/70 hover:text-white">Launch app</Link>
                <a href="#how" className="block text-white/70 hover:text-white">How it works</a>
              </div>
              <div className="space-y-3">
                <p className="font-semibold uppercase tracking-wider">Engine</p>
                <a href="https://composio.dev" target="_blank" rel="noreferrer" className="block text-white/70 hover:text-white">Composio</a>
                <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="block text-white/70 hover:text-white">NVIDIA NIM</a>
              </div>
              <div className="space-y-3">
                <p className="font-semibold uppercase tracking-wider">Legal</p>
                <span className="block text-white/70">Privacy</span>
                <span className="block text-white/70">Terms</span>
              </div>
            </div>
          </div>

          <p className="mt-16 text-[11px] uppercase tracking-widest text-white/60">FounderOps © 2026</p>
        </div>

        {/* giant wordmark */}
        <div className="select-none px-6 pt-6">
          <h2 className="whitespace-nowrap text-[20vw] font-light leading-[0.8] tracking-tight text-white">
            FounderOps
          </h2>
        </div>
      </footer>
    </div>
  );
}
