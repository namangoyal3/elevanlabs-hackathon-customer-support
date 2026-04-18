'use client';

import { useState } from 'react';

interface Props {
  replies: string[];
}

export function SuggestedReplies({ replies }: Props) {
  const [flashing, setFlashing] = useState<number | null>(null);

  if (replies.length === 0) return null;

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API unavailable (e.g. insecure context) — fallback: do nothing,
      // chip flash still shows visual feedback
    }
    setFlashing(idx);
    setTimeout(() => setFlashing(null), 600);
  };

  return (
    <section className="space-y-2">
      <h3 className="text-muted text-xs uppercase tracking-wide">Suggested replies</h3>
      <div className="flex flex-wrap gap-2">
        {replies.map((r, i) => (
          <button
            key={i}
            onClick={() => copy(r, i)}
            className={`border-border bg-surface hover:bg-accent/20 rounded-full border px-3 py-1 text-left text-sm transition-colors ${
              flashing === i ? 'bg-accent/40' : ''
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </section>
  );
}
