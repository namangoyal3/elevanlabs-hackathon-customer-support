'use client';

import { useRef } from 'react';

interface Props {
  /** Range -1.0 to 1.0. 0 is neutral. */
  score: number;
}

function sentimentLabel(score: number) {
  if (score >= 0.3) return 'Positive';
  if (score >= 0) return 'Neutral';
  if (score >= -0.6) return 'Negative';
  return 'Hostile';
}

function markerColor(score: number) {
  if (score >= 0.3) return 'bg-emerald-400';
  if (score >= 0) return 'bg-amber-300';
  if (score >= -0.6) return 'bg-orange-400';
  return 'bg-alert';
}

export function SentimentBar({ score }: Props) {
  // Normalize [-1, 1] → [0, 100].
  const pct = Math.max(0, Math.min(100, Math.round(((score + 1) / 2) * 100)));
  const label = sentimentLabel(score);
  const marker = markerColor(score);

  const prevScore = useRef<number>(score);
  const delta = score - prevScore.current;
  prevScore.current = score;

  const trend = delta > 0.05 ? '↑' : delta < -0.05 ? '↓' : '→';
  const trendColor =
    delta > 0.05 ? 'text-emerald-400' : delta < -0.05 ? 'text-alert-fg' : 'text-amber-300';

  return (
    <section className="border-border bg-surface shadow-card rounded-lg border p-4">
      <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
        <h3 className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Customer sentiment</h3>
        <span className="text-fg-subtle font-mono text-2xs" data-nums>
          {score >= 0 ? '+' : ''}
          {score.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-fg text-sm font-medium">{label}</p>
        <span className={`text-sm font-medium ${trendColor}`} aria-hidden="true">
          {trend}
        </span>
      </div>

      {/* Gradient track — full emotional spectrum always visible */}
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-alert/40 via-amber-400/30 to-emerald-400/40">
        {/* Marker dot slides over the gradient */}
        <div
          className="relative h-full"
          style={{ width: `${pct}%` }}
        >
          <div
            className={`${marker} absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full shadow-md ring-2 ring-bg transition-all duration-500 ease-out`}
          />
        </div>
      </div>

      <div className="text-fg-subtle mt-1.5 flex justify-between font-mono text-2xs">
        <span>Hostile</span>
        <span>Neutral</span>
        <span>Positive</span>
      </div>
    </section>
  );
}
