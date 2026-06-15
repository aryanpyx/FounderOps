import React from 'react';

/**
 * FounderOps brand mark — the real logo image (public/logo.png).
 * The artwork is black-on-white, so on dark surfaces we invert it to white-on-
 * dark (the whole product shell renders inside a `.dark` wrapper).
 */
export function FounderOpsLogo({
  size = 'md',
  showTagline = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const h = size === 'lg' ? 'h-24' : size === 'sm' ? 'h-8' : 'h-11';

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="FounderOps"
        className={`${h} w-auto object-contain dark:invert`}
      />
      {showTagline && (
        <p className="text-[11px] text-muted-foreground">The memory layer for founders</p>
      )}
    </div>
  );
}
