'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptChunk } from '@/types';

interface Props {
  chunks: TranscriptChunk[];
}

const SPEAKER_LABEL_CLASS: Record<TranscriptChunk['speaker'], string> = {
  agent: 'text-accent-fg',
  customer: 'text-amber-200/90',
};

const SPEAKER_BORDER_CLASS: Record<TranscriptChunk['speaker'], string> = {
  agent: 'border-accent/30',
  customer: 'border-amber-400/30',
};

export function LiveTranscript({ chunks }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chunks.length]);

  return (
    <section className="border-border bg-surface shadow-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <header className="border-border flex items-center justify-between border-b px-5 py-2.5">
        <h3 className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Live transcript</h3>
        {chunks.length > 0 && (
          <span className="text-fg-subtle font-mono text-2xs">{chunks.length} turns</span>
        )}
      </header>
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-5 text-sm">
        {chunks.length === 0 ? (
          <p className="text-fg-muted italic">Waiting for the call to begin.</p>
        ) : (
          chunks.map((c, i) => (
            <div
              key={i}
              className={`animate-rise-in border-l-2 ${SPEAKER_BORDER_CLASS[c.speaker]} pl-3`}
            >
              <p className={`font-mono text-2xs uppercase tracking-[0.1em] ${SPEAKER_LABEL_CLASS[c.speaker]}`}>
                {c.speaker}
              </p>
              <p className="text-fg mt-0.5 leading-relaxed">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
