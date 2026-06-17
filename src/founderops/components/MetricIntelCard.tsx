'use client';

import React, { useEffect, useState } from 'react';
import { Sigma, ArrowRight, TrendingUp } from 'lucide-react';

type Insight = {
  metric: string;
  fromLabel: string;
  toLabel: string;
  change: string;
  currency: string;
  projection: number | null;
  horizon: number;
};
type Resp = { configured: boolean; hasMetrics: boolean; insights: Insight[] };

const fmt = (n: number) => n.toLocaleString('en-US');

export function MetricIntelCard() {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    fetch('/api/founderops/metric-intel', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Resp) => setData(d))
      .catch(() => setData({ configured: false, hasMetrics: false, insights: [] }));
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/[0.10] via-orange-500/[0.05] to-transparent p-6 sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-inset ring-red-500/40">
            <Sigma className="h-6 w-6 text-red-300" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">Metric Intelligence</h3>
            <p className="text-xs text-zinc-400">Exact forecasts on your metrics — computed, never guessed.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-red-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Powered by Wolfram|Alpha
        </span>
      </div>

      <div className="relative mt-5">
        {data === null ? (
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        ) : !data.configured ? (
          <p className="text-sm leading-relaxed text-zinc-400">
            Add <span className="font-mono text-red-300">WOLFRAM_APP_ID</span> to compute growth-rate and 6-month
            forecasts on your captured metrics.
          </p>
        ) : data.insights.length === 0 ? (
          <p className="text-sm leading-relaxed text-zinc-400">
            {data.hasMetrics
              ? 'Capture a metric with a before → after value (e.g. MRR $4,200 → $5,100) and Wolfram will forecast it.'
              : 'Capture a metric and Wolfram will compute its trajectory.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.insights.map((ins, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-bold uppercase tracking-wider text-zinc-400">{ins.metric}</p>
                  {ins.change ? (
                    <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                      {ins.change}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-base font-bold text-white">
                  <span>{ins.fromLabel}</span>
                  <ArrowRight className="h-4 w-4 text-zinc-500" />
                  <span>{ins.toLabel}</span>
                </div>
                {ins.projection !== null ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 ring-1 ring-inset ring-red-500/20">
                    <TrendingUp className="h-4 w-4 shrink-0 text-red-300" />
                    <p className="text-xs text-zinc-300">
                      Wolfram projects{' '}
                      <span className="font-extrabold text-red-200">
                        {ins.currency}
                        {fmt(ins.projection)}
                      </span>{' '}
                      in {ins.horizon} months
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-zinc-500">One-off change — no recurring forecast.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
