interface Props {
  label: string;
  confidence: number;
}

const INTENT_STYLES: Record<string, string> = {
  failed_transaction: 'bg-sky-500/10 text-sky-100 ring-sky-500/30',
  kyc_issue:          'bg-amber-500/10 text-amber-100 ring-amber-500/30',
  loan_status:        'bg-violet-500/10 text-violet-100 ring-violet-500/30',
  wallet_topup:       'bg-cyan-500/10 text-cyan-100 ring-cyan-500/30',
  chargeback:         'bg-pink-500/10 text-pink-100 ring-pink-500/30',
  account_freeze:     'bg-orange-500/10 text-orange-100 ring-orange-500/30',
  rewards:            'bg-emerald-500/10 text-emerald-100 ring-emerald-500/30',
  privacy:            'bg-slate-400/10 text-slate-100 ring-slate-400/30',
  other:              'bg-fg-subtle/10 text-fg-muted ring-fg-subtle/30',
};

const LABELS: Record<string, string> = {
  failed_transaction: 'Failed transaction',
  kyc_issue:          'KYC issue',
  loan_status:        'Loan status',
  wallet_topup:       'Wallet top-up',
  chargeback:         'Chargeback',
  account_freeze:     'Account freeze',
  rewards:            'Rewards',
  privacy:            'Privacy',
  other:              'Other',
};

const SYMBOLS: Record<string, string> = {
  failed_transaction: '↻',
  kyc_issue:          '◉',
  account_freeze:     '⊘',
  loan_status:        '◎',
  wallet_topup:       '◈',
  chargeback:         '◇',
  rewards:            '◈',
  privacy:            '◉',
};

export function IntentBadge({ label, confidence }: Props) {
  const shown = label !== '' && confidence >= 0.7;

  if (!shown) {
    return (
      <div className="bg-surface border-border text-fg-muted flex w-full items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-sm">
        <span className="bg-fg-muted/60 animate-pulse-dot h-1.5 w-1.5 rounded-full" aria-hidden="true" />
        <span>Detecting intent…</span>
      </div>
    );
  }

  const humanLabel = LABELS[label] ?? label.replace(/_/g, ' ');
  const symbol = SYMBOLS[label] ?? '◆';
  const styles = INTENT_STYLES[label] ?? INTENT_STYLES.other;
  const opacityClass = confidence >= 0.85 ? 'opacity-100' : 'opacity-75';

  return (
    <div
      className={`animate-rise-in inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset ${styles} ${opacityClass}`}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{humanLabel}</span>
    </div>
  );
}
