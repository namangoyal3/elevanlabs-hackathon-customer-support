interface Props {
  /** Range -1.0 to 1.0. 0 is neutral. */
  score: number;
}

export function SentimentBar({ score }: Props) {
  // Normalize [-1, 1] → [0, 100].
  const pct = Math.max(0, Math.min(100, Math.round(((score + 1) / 2) * 100)));

  const track =
    score >= 0.3
      ? 'bg-emerald-400/90'
      : score >= 0
      ? 'bg-amber-300/90'
      : score >= -0.6
      ? 'bg-orange-400/90'
      : 'bg-alert';

  const label =
    score >= 0.3
      ? 'Positive'
      : score >= 0
      ? 'Neutral'
      : score >= -0.6
      ? 'Negative'
      : 'Hostile';

  return (
    <section className="border-border bg-surface shadow-card rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Customer sentiment</h3>
          <p className="text-fg-muted text-2xs mt-0.5">{label}</p>
        </div>
        <span className="font-mono text-sm" data-nums>
          {score >= 0 ? '+' : ''}
          {score.toFixed(2)}
        </span>
      </div>
      <div className="bg-bg border-border mt-3 h-1.5 overflow-hidden rounded-full border">
        <div
          className={`${track} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-fg-subtle mt-1 flex justify-between text-2xs font-mono">
        <span>−1</span>
        <span>0</span>
        <span>+1</span>
      </div>
    </section>
  );
}
