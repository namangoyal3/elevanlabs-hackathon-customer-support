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

export function PostCallSummary({ summary }: Props) {
  if (!summary) {
    return (
      <div className="border-border bg-surface shadow-card mx-4 mb-4 rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="bg-accent/50 animate-pulse-dot h-2 w-2 rounded-full"
          />
          <p className="text-fg-muted text-sm">Generating post-call summary…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface shadow-card animate-rise-in mx-4 mb-4 overflow-hidden rounded-lg border">
      <header className="border-border flex items-center justify-between border-b px-5 py-3">
        <h3 className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Post-call summary</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-2xs font-medium uppercase tracking-[0.1em] ring-1 ring-inset ${DISPOSITION_STYLES[summary.disposition]}`}
        >
          {DISPOSITION_LABEL[summary.disposition]}
        </span>
      </header>

      <div className="grid gap-5 px-5 py-4 md:grid-cols-[1fr_auto]">
        <p className="text-fg leading-relaxed">{summary.text}</p>

        <dl className="text-2xs uppercase tracking-[0.12em] grid grid-cols-2 gap-x-5 gap-y-1 md:grid-cols-1 md:gap-y-2">
          <dt className="text-fg-subtle">Sentiment</dt>
          <dd className="text-fg capitalize">{summary.sentimentTrend}</dd>
          <dt className="text-fg-subtle">CSAT</dt>
          <dd className="text-fg font-mono" data-nums>
            {Math.round(summary.csatPrediction * 100)}%
          </dd>
        </dl>
      </div>

      {summary.followUpActions.length > 0 && (
        <div className="border-border border-t px-5 py-4">
          <p className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Follow-up</p>
          <ul className="mt-2 space-y-1.5">
            {summary.followUpActions.map((a, i) => (
              <li key={i} className="text-fg flex items-start gap-2.5 text-sm leading-snug">
                <span aria-hidden="true" className="text-fg-subtle mt-[0.35rem] h-[3px] w-[3px] shrink-0 rounded-full bg-current" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
