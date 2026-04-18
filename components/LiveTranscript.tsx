'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptChunk } from '@/types';
import type { CallState } from '@/types';

interface Props {
  chunks: TranscriptChunk[];
  status: CallState['status'];
}

const SPEAKER_LABEL_CLASS: Record<TranscriptChunk['speaker'], string> = {
  agent: 'text-accent-fg',
  customer: 'text-amber-200/90',
};

const SPEAKER_BORDER_CLASS: Record<TranscriptChunk['speaker'], string> = {
  agent: 'border-accent/30',
  customer: 'border-amber-400/30',
};

function EmptyState({ status }: { status: CallState['status'] }) {
  if (status === 'pre_call') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="text-fg-subtle/50 text-2xl leading-none" aria-hidden="true">↑</div>
        <p className="text-fg-muted text-sm leading-relaxed">
          Start the call to begin<br />live transcription
        </p>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="flex items-center gap-2.5 py-6">
        <span
          aria-hidden="true"
          className="bg-accent/70 animate-pulse-dot h-2 w-2 shrink-0 rounded-full"
        />
        <p className="text-fg-muted text-sm">Listening…</p>
      </div>
    );
  }

  return null;
}

export function LiveTranscript({ chunks, status }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chunks.length]);

  return (
    <section className="border-border bg-surface shadow-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <header className="border-border flex items-center justify-between border-b px-5 py-2.5">
        <h3 className="text-fg-subtle flex items-center gap-2 text-2xs uppercase tracking-[0.12em]">
          {status === 'active' && (
            <span
              aria-hidden="true"
              className="bg-accent/70 animate-pulse-dot h-1.5 w-1.5 shrink-0 rounded-full"
            />
          )}
          Live transcript
        </h3>
        {chunks.length > 0 && (
          <span className="text-fg-subtle font-mono text-2xs">
            {chunks.length > 0 && status === 'active'
              ? `Last: ${chunks[chunks.length - 1]?.speaker ?? '—'} · `
              : ''}
            {chunks.length} turns
          </span>
        )}
      </header>
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-5 text-sm">
        {chunks.length === 0 ? (
          <EmptyState status={status} />
        ) : (
          chunks.map((c, i) => (
            <div
              key={i}
              className={`animate-rise-in border-l-[3px] ${SPEAKER_BORDER_CLASS[c.speaker]} pl-3`}
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
