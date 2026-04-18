import type { CallSummary } from '@/types';

interface Props {
  summary: CallSummary | null;
}

const DISPOSITION_STYLES: Record<CallSummary['disposition'], string> = {
  resolved:  'bg-emerald-500/15 text-emerald-100 ring-emerald-500/30',
  follow_up: 'bg-amber-500/15  text-amber-100  ring-amber-500/30',
  escalated: 'bg-alert/20      text-alert-fg   ring-alert/40',
  abandoned: 'bg-fg-muted/15   text-fg-muted   ring-fg-subtle/30',
};

const DISPOSITION_LABEL: Record<CallSummary['disposition'], string> = {
  resolved: 'Resolved',
  follow_up: 'Follow-up',
  escalated: 'Escalated',
  abandoned: 'Abandoned',
};

const SENTIMENT_SYMBOL: Record<CallSummary['sentimentTrend'], string> = {
  positive:  '↑',
  recovered: '↑',
  neutral:   '→',
  negative:  '↓',
};

const SENTIMENT_COLOR: Record<CallSummary['sentimentTrend'], string> = {
  positive:  'text-emerald-400',
  recovered: 'text-emerald-400',
  neutral:   'text-amber-300',
  negative:  'text-alert-fg',
};

function LoadingSkeleton() {
  return (
    <div className="border-border bg-surface shadow-card animate-rise-in flex flex-col gap-4 overflow-hidden rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <div className="bg-surface-2 h-3 w-32 animate-pulse rounded" />
        <div className="bg-surface-2 h-6 w-20 animate-pulse rounded-full" />
      </div>
      {/* Summary text skeleton */}
      <div className="space-y-2">
        <div className="bg-surface-2 h-4 w-full animate-pulse rounded" />
        <div className="bg-surface-2 h-4 w-5/6 animate-pulse rounded" />
        <div className="bg-surface-2 h-4 w-4/5 animate-pulse rounded" />
      </div>
      {/* Metadata row skeleton */}
      <div className="flex gap-4">
        <div className="bg-surface-2 h-8 w-24 animate-pulse rounded" />
        <div className="bg-surface-2 h-8 w-16 animate-pulse rounded" />
      </div>
      {/* Follow-up skeleton */}
      <div className="space-y-2">
        <div className="bg-surface-2 h-3 w-20 animate-pulse rounded" />
        <div className="bg-surface-2 h-4 w-full animate-pulse rounded" />
        <div className="bg-surface-2 h-4 w-11/12 animate-pulse rounded" />
        <div className="bg-surface-2 h-4 w-10/12 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function PostCallSummary({ summary }: Props) {
  if (!summary) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="border-border bg-surface shadow-card animate-rise-in overflow-hidden rounded-lg border">
      {/* Header: label left, disposition badge centered */}
      <header className="border-border border-b px-5 py-4">
        <h3 className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Post-call summary</h3>
        <div className="mt-3 flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${DISPOSITION_STYLES[summary.disposition]}`}
          >
            {DISPOSITION_LABEL[summary.disposition]}
          </span>
        </div>
      </header>

      {/* Summary text */}
      <div className="px-5 py-4">
        <p className="text-fg leading-relaxed">{summary.text}</p>
      </div>

      {/* Metadata strip */}
      <div className="border-border border-t px-5 py-3">
        <dl className="flex items-center gap-6 text-sm">
          <div>
            <dt className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Sentiment</dt>
            <dd className="text-fg mt-0.5 flex items-center gap-1 capitalize">
              <span
                className={`font-medium ${SENTIMENT_COLOR[summary.sentimentTrend]}`}
                aria-hidden="true"
              >
                {SENTIMENT_SYMBOL[summary.sentimentTrend]}
              </span>
              {summary.sentimentTrend}
            </dd>
          </div>
          <div>
            <dt className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">CSAT</dt>
            <dd className="text-fg mt-0.5 font-mono font-medium" data-nums>
              {Math.round(summary.csatPrediction * 100)}%
            </dd>
          </div>
        </dl>
      </div>

      {/* Follow-up actions */}
      {summary.followUpActions.length > 0 && (
        <div className="border-border border-t px-5 py-4">
          <p className="text-fg-subtle border-border mb-3 border-b pb-2 text-2xs uppercase tracking-[0.12em]">Follow-up</p>
          <ol className="space-y-2.5">
            {summary.followUpActions.map((a, i) => (
              <li key={i} className="text-fg flex items-start gap-3 text-sm leading-snug">
                <span
                  aria-hidden="true"
                  className="text-fg-subtle font-mono text-2xs mt-0.5 shrink-0 tabular-nums"
                >
                  {i + 1}.
                </span>
                <span className="text-fg-subtle mr-1 shrink-0" aria-hidden="true">□</span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
