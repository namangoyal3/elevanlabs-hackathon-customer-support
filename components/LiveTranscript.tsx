'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptChunk } from '@/types';

interface Props {
  chunks: TranscriptChunk[];
}

export function LiveTranscript({ chunks }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chunks.length]);

  return (
    <section className="border-border bg-surface flex min-h-0 flex-1 flex-col rounded-lg border">
      <header className="border-border border-b px-4 py-2">
        <h3 className="text-muted text-xs uppercase tracking-wide">Live transcript</h3>
      </header>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-4 font-mono text-sm">
        {chunks.length === 0 ? (
          <p className="text-muted italic">Waiting for the call to begin…</p>
        ) : (
          chunks.map((c, i) => (
            <div key={i} className="animate-in fade-in duration-200">
              <span
                className={
                  c.speaker === 'agent'
                    ? 'text-accent text-xs uppercase tracking-wide'
                    : 'text-amber-400 text-xs uppercase tracking-wide'
                }
              >
                {c.speaker}
              </span>
              <p className="text-white">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
