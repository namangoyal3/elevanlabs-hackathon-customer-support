import type { CallSummary } from '@/types';

interface Props {
  summary: CallSummary | null;
}

const DISPOSITION_STYLES: Record<CallSummary['disposition'], string> = {
  resolved: 'bg-emerald-600/20 text-emerald-200 ring-emerald-500/40',
  follow_up: 'bg-amber-600/20 text-amber-200 ring-amber-500/40',
  escalated: 'bg-red-600/20 text-red-200 ring-red-500/40',
  abandoned: 'bg-neutral-600/30 text-neutral-200 ring-neutral-500/40',
};

export function PostCallSummary({ summary }: Props) {
  if (!summary) {
    return (
      <div className="border-border bg-surface mx-4 mb-4 rounded-lg border p-4 text-center">
        <p className="text-muted animate-pulse text-sm">Generating post-call summary…</p>
      </div>
    );
  }
  return (
    <div className="border-border bg-surface animate-in slide-in-from-bottom-4 mx-4 mb-4 space-y-3 rounded-lg border p-4 duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-muted text-xs uppercase tracking-wide">Post-call summary</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${DISPOSITION_STYLES[summary.disposition]}`}
        >
          {summary.disposition.replace('_', ' ')}
        </span>
      </div>

      <p className="text-sm leading-relaxed">{summary.text}</p>

      {summary.followUpActions.length > 0 && (
        <div>
          <p className="text-muted text-xs uppercase tracking-wide">Follow-up actions</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
            {summary.followUpActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted">
          Sentiment trend:{' '}
          <span className="text-white capitalize">{summary.sentimentTrend}</span>
        </span>
        <span className="text-muted">
          CSAT prediction:{' '}
          <span className="text-white">{(summary.csatPrediction * 100).toFixed(0)}%</span>
        </span>
      </div>
    </div>
  );
}
