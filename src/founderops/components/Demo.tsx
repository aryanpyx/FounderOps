'use client';

import React, { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { isDemoMode, setDemoMode } from '@/services/_data';

function toggle(on: boolean) {
  setDemoMode(!on);
  // Full reload so every page re-fetches through the demo-aware data layer.
  window.location.reload();
}

/** Sidebar toggle to enter/exit demo data. */
export function DemoToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isDemoMode()), []);

  return (
    <button
      onClick={() => toggle(on)}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
        on
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
          : 'border-border/60 bg-border/20 text-muted-foreground hover:text-white hover:border-border'
      }`}
      title={on ? 'Show your real data again' : 'Preview the product with sample data'}
    >
      <FlaskConical className="h-3.5 w-3.5" />
      {on ? 'Exit demo data' : 'View demo data'}
    </button>
  );
}

/** Thin banner shown across the product while demo mode is active. */
export function DemoBanner() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isDemoMode()), []);
  if (!on) return null;

  return (
    <div className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-[11px] font-medium text-amber-200">
      <FlaskConical className="h-3.5 w-3.5" />
      Demo data — exploring FounderOps with a sample founder workspace.
      <button onClick={() => toggle(true)} className="ml-1 inline-flex items-center gap-1 underline hover:text-white">
        <X className="h-3 w-3" /> exit
      </button>
    </div>
  );
}
