interface Props {
  /** Range -1.0 to 1.0. 0 is neutral. */
  score: number;
}

export function SentimentBar({ score }: Props) {
  // Normalize [-1, 1] → [0, 100] for bar width.
  const pct = Math.max(0, Math.min(100, Math.round(((score + 1) / 2) * 100)));

  const color =
    score >= 0.3 ? 'bg-emerald-500' : score >= 0 ? 'bg-amber-400' : 'bg-red-500';

  const label =
    score >= 0.3 ? 'Positive' : score >= 0 ? 'Neutral' : score >= -0.6 ? 'Negative' : 'Hostile';

  return (
    <section className="border-border bg-surface rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-muted text-xs uppercase tracking-wide">Customer sentiment</h3>
        <span className="font-mono text-sm">{score.toFixed(2)}</span>
      </div>
      <div className="bg-bg mt-2 h-2 overflow-hidden rounded">
        <div
          className={`${color} h-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-muted mt-1 text-xs">{label}</p>
    </section>
  );
}
