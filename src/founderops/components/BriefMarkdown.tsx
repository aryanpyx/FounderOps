import React from 'react';

/**
 * Lightweight renderer for the intelligence-engine briefs (daily / weekly).
 * The LLM emits emoji-headed sections, bullet lists, **bold**, and [Severity]
 * tags. This turns that into a clean, scannable layout without pulling in a
 * full markdown dependency.
 */

const SECTION_EMOJI = ['🔴', '✅', '📋', '📈', '🎯', '🟡', '🔵', '⚠️', '📊', '🚀', '💡', '📅', '🏆'];

function badgeClass(label: string): string {
  const base = 'inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border mx-0.5 align-middle';
  switch (label) {
    case 'High':
    case 'Overdue':
      return `${base} text-rose-300 border-rose-500/40 bg-rose-500/10`;
    case 'Medium':
      return `${base} text-amber-300 border-amber-500/40 bg-amber-500/10`;
    case 'Resolved':
    case 'Fulfilled':
      return `${base} text-emerald-300 border-emerald-500/40 bg-emerald-500/10`;
    case 'Open':
      return `${base} text-indigo-300 border-indigo-500/40 bg-indigo-500/10`;
    default:
      return `${base} text-zinc-300 border-border/50 bg-border/30`;
  }
}

function badgeize(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\[(High|Medium|Low|Open|Overdue|Resolved|Fulfilled)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={`${keyBase}-bg${i++}`} className={badgeClass(m[1]!)}>
        {m[1]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function inlineNodes(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      nodes.push(
        <strong key={`${keyBase}-b${i}`} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>,
      );
    } else if (part) {
      nodes.push(...badgeize(part, `${keyBase}-t${i}`));
    }
  });
  return nodes;
}

export function BriefMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1 text-sm text-zinc-300 leading-relaxed select-text">
      {lines.map((raw, idx) => {
        const line = raw.trim();
        const key = `l${idx}`;

        if (!line) return <div key={key} className="h-2" />;

        const isEmojiHeader = SECTION_EMOJI.some((e) => line.startsWith(e));
        const headingMatch = /^#{1,3}\s+(.*)/.exec(line);
        if (isEmojiHeader || headingMatch) {
          const content = headingMatch ? headingMatch[1]! : line;
          return (
            <h4 key={key} className="text-xs font-bold text-white uppercase tracking-wide pt-3 first:pt-0">
              {inlineNodes(content, key)}
            </h4>
          );
        }

        const bulletMatch = /^[-*•]\s+(.*)/.exec(line);
        if (bulletMatch) {
          return (
            <div key={key} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
              <span>{inlineNodes(bulletMatch[1]!, key)}</span>
            </div>
          );
        }

        const numMatch = /^(\d+)[.)]\s+(.*)/.exec(line);
        if (numMatch) {
          return (
            <div key={key} className="flex items-start gap-2 pl-1">
              <span className="text-[10px] font-mono font-bold text-indigo-400 mt-0.5 shrink-0">{numMatch[1]}.</span>
              <span>{inlineNodes(numMatch[2]!, key)}</span>
            </div>
          );
        }

        return <p key={key}>{inlineNodes(line, key)}</p>;
      })}
    </div>
  );
}
