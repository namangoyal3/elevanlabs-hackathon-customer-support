'use client';

import { useState } from 'react';

interface Props {
  replies: string[];
}

export function SuggestedReplies({ replies }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);

  if (replies.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-fg-subtle border-border mb-3 border-b pb-2 text-2xs uppercase tracking-[0.12em]">
          <span aria-hidden="true" className="mr-1.5 text-fg-subtle">◆</span>
          How to respond
        </h3>
        <ul className="flex flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <div className="bg-surface-2 animate-pulse h-10 w-full rounded-md" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable in insecure context; flash still gives feedback
    }
    setCopiedIdx(idx);
    setFlashIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
    setTimeout(() => setFlashIdx(null), 300);
  };

  return (
    <section className="space-y-2">
      <h3 className="text-fg-subtle border-border mb-3 border-b pb-2 text-2xs uppercase tracking-[0.12em]">
        <span aria-hidden="true" className="mr-1.5 text-fg-subtle">◆</span>
        How to respond
      </h3>
      <ul className="flex flex-col gap-1.5">
        {replies.map((r, i) => (
          <li key={i}>
            <button
              onClick={() => copy(r, i)}
              className={`border-border hover:border-border-strong group flex w-full items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors ${
                flashIdx === i
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-surface hover:bg-surface-2'
              }`}
            >
              {/* Number prefix */}
              <span className="text-fg-subtle font-mono text-2xs shrink-0 tabular-nums" aria-hidden="true">
                {i + 1}.
              </span>
              <span className="text-fg flex-1">{r}</span>
              <span
                className={`shrink-0 text-2xs uppercase tracking-[0.12em] transition-colors ${
                  copiedIdx === i ? 'text-accent-fg' : 'text-fg-subtle group-hover:text-fg-muted'
                }`}
              >
                {copiedIdx === i ? '✓ Copied' : 'Copy'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
