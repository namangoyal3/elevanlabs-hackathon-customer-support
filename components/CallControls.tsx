'use client';

import type { CallState } from '@/types';

interface Props {
  status: CallState['status'];
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
}

export function CallControls({ status, onStart, onEnd, onReset }: Props) {
  if (status === 'pre_call') {
    return (
      <button
        onClick={onStart}
        className="bg-accent text-accent-fg hover:bg-accent/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-card transition-colors"
      >
        <span className="bg-accent-fg h-1.5 w-1.5 rounded-full" aria-hidden="true" />
        Start call
      </button>
    );
  }
  if (status === 'active') {
    return (
      <button
        onClick={onEnd}
        className="bg-alert text-alert-fg hover:bg-alert/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-card transition-colors"
      >
        <span className="bg-alert-fg h-2 w-2 rounded-sm" aria-hidden="true" />
        End call
      </button>
    );
  }
  if (status === 'ended') {
    return (
      <button
        onClick={onReset}
        className="border-border-strong text-fg hover:bg-surface inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
      >
        New call
      </button>
    );
  }
  return null;
}
