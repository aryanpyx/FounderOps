import React from 'react';
import { Brain } from 'lucide-react';

/**
 * FounderOps brand mark — gradient brain glyph + wordmark.
 * Used in the sidebar (md) and the login / getting-started screen (lg).
 */
export function FounderOpsLogo({
  size = 'md',
  showTagline = false,
}: {
  size?: 'md' | 'lg';
  showTagline?: boolean;
}) {
  const box = size === 'lg' ? 'w-12 h-12 rounded-xl' : 'w-9 h-9 rounded-lg';
  const glyph = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const title = size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20`}
      >
        <Brain className={`${glyph} text-white`} />
      </div>
      <div className="leading-tight">
        <h1 className={`${title} font-bold tracking-tight text-foreground`}>
          Founder<span className="text-indigo-400">Ops</span>
        </h1>
        {showTagline && (
          <p className="text-[11px] text-muted-foreground mt-0.5">The memory layer for founders</p>
        )}
      </div>
    </div>
  );
}
