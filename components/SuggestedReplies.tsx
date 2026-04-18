'use client';

import { useState } from 'react';

interface Props {
  replies: string[];
}

export function SuggestedReplies({ replies }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (replies.length === 0) return null;

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable (insecure context); chip flash still provides feedback
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  return (
    <section className="space-y-2">
      <h3 className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Suggested replies</h3>
      <ul className="flex flex-col gap-1.5">
        {replies.map((r, i) => (
          <li key={i}>
            <button
              onClick={() => copy(r, i)}
              className="border-border bg-surface hover:bg-surface-2 hover:border-border-strong group flex w-full items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors"
            >
              <span className="text-fg">{r}</span>
              <span
                className={`shrink-0 text-2xs uppercase tracking-[0.12em] transition-colors ${
                  copiedIdx === i ? 'text-accent-fg' : 'text-fg-subtle group-hover:text-fg-muted'
                }`}
              >
                {copiedIdx === i ? 'Copied' : 'Copy'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
