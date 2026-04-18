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
        className="bg-accent rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        ● Start call
      </button>
    );
  }
  if (status === 'active') {
    return (
      <button
        onClick={onEnd}
        className="bg-alert rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        ■ End call
      </button>
    );
  }
  if (status === 'ended') {
    return (
      <button
        onClick={onReset}
        className="border-border rounded-md border px-4 py-2 text-sm font-medium hover:bg-white/5"
      >
        New call
      </button>
    );
  }
  return null;
}
