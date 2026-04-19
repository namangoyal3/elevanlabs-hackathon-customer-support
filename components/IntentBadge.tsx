interface Props {
  label: string;
  confidence: number;
}

const INTENT_COLORS: Record<string, string> = {
  failed_transaction: 'bg-blue-600/20 text-blue-200 ring-blue-500/40',
  kyc_issue: 'bg-amber-600/20 text-amber-200 ring-amber-500/40',
  loan_status: 'bg-violet-600/20 text-violet-200 ring-violet-500/40',
  wallet_topup: 'bg-cyan-600/20 text-cyan-200 ring-cyan-500/40',
  chargeback: 'bg-pink-600/20 text-pink-200 ring-pink-500/40',
  account_freeze: 'bg-orange-600/20 text-orange-200 ring-orange-500/40',
  rewards: 'bg-emerald-600/20 text-emerald-200 ring-emerald-500/40',
  privacy: 'bg-slate-500/20 text-slate-200 ring-slate-400/40',
  other: 'bg-neutral-700/40 text-neutral-200 ring-neutral-500/40',
};

function humanize(label: string): string {
  if (!label) return 'Listening…';
  return label
    .split('_')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

export function IntentBadge({ label, confidence }: Props) {
  const styles = INTENT_COLORS[label] ?? INTENT_COLORS.other;
  const pct = Math.round(confidence * 100);
  const shown = label !== '' && confidence >= 0.7;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all ${styles}`}
    >
      <span>{humanize(label)}</span>
      {shown && <span className="text-xs opacity-80">· {pct}%</span>}
    </div>
  );
}
