'use client';

import { useEffect, useState } from 'react';
import type { CallState } from '@/types';

interface Props {
  status: CallState['status'];
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
}

export function CallControls({ status, onStart, onEnd, onReset }: Props) {
  const [attentionReady, setAttentionReady] = useState(false);

  // After 3s on pre_call without action, draw attention to the start button
  useEffect(() => {
    if (status !== 'pre_call') {
      setAttentionReady(false);
      return;
    }
    const id = setTimeout(() => setAttentionReady(true), 3000);
    return () => clearTimeout(id);
  }, [status]);

  if (status === 'pre_call') {
    return (
      <button
        onClick={onStart}
        className={`bg-accent text-accent-fg hover:bg-accent/90 inline-flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm font-medium shadow-card transition-all ${
          attentionReady ? 'ring-2 ring-accent/40 ring-offset-1 ring-offset-bg animate-pulse' : ''
        }`}
      >
        <span className="bg-accent-fg h-1.5 w-1.5 rounded-full" aria-hidden="true" />
        Start call
        <span className="text-accent-fg/60 font-mono text-2xs" aria-hidden="true">⌘ ↵</span>
      </button>
    );
  }
  if (status === 'active') {
    return (
      <button
        onClick={onEnd}
        className="bg-alert text-alert-fg hover:bg-alert/90 inline-flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm font-medium shadow-card transition-colors"
      >
        <span className="bg-white/90 h-2 w-2 rounded-sm" aria-hidden="true" />
        End call
      </button>
    );
  }
  if (status === 'ended') {
    return (
      <button
        onClick={onReset}
        className="border-border-strong text-fg hover:bg-surface inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
      >
        New call
      </button>
    );
  }
  return null;
}
