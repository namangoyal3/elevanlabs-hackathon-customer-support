'use client';

import { DEMO_PERSONAS, type DemoPersona } from '@/lib/demo-personas';
import type { Contact } from '@/types';

interface Props {
  onPick: (persona: DemoPersona) => void;
}

const TIER_STYLES: Record<Contact['tier'], string> = {
  standard: 'text-fg-subtle',
  premium: 'text-fg',
  enterprise: 'text-accent-fg bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded-sm',
};

const INTENT_CHIP_STYLES: Record<string, string> = {
  failed_transaction: 'bg-sky-500/10 text-sky-200 ring-sky-500/25',
  kyc_issue:          'bg-amber-500/10 text-amber-200 ring-amber-500/25',
  loan_status:        'bg-violet-500/10 text-violet-200 ring-violet-500/25',
  wallet_topup:       'bg-cyan-500/10 text-cyan-200 ring-cyan-500/25',
  account_freeze:     'bg-orange-500/10 text-orange-200 ring-orange-500/25',
};

const INTENT_LABELS: Record<string, string> = {
  failed_transaction: 'Failed transaction',
  kyc_issue:          'KYC issue',
  loan_status:        'Loan status',
  wallet_topup:       'Wallet top-up',
  account_freeze:     'Account freeze',
};

const INTENT_SYMBOLS: Record<string, string> = {
  failed_transaction: '↻',
  kyc_issue:          '◉',
  loan_status:        '◎',
  wallet_topup:       '◈',
  account_freeze:     '⊘',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function PersonaPicker({ onPick }: Props) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="mb-7">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="bg-amber-400 animate-pulse-dot h-1.5 w-1.5 rounded-full" aria-hidden="true" />
          <p className="text-fg-subtle text-2xs uppercase tracking-[0.16em]">Incoming</p>
        </div>
        <h2 className="font-serif text-4xl leading-tight tracking-tight">
          Who&rsquo;s calling?
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {DEMO_PERSONAS.map((p) => {
          const intentStyle = INTENT_CHIP_STYLES[p.predictedIntent] ?? 'bg-fg-subtle/10 text-fg-muted ring-fg-subtle/25';
          const intentLabel = INTENT_LABELS[p.predictedIntent] ?? p.predictedIntent.replace(/_/g, ' ');
          const intentSymbol = INTENT_SYMBOLS[p.predictedIntent] ?? '◆';
          const isEnterprise = p.tier === 'enterprise';

          return (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className={`group relative flex w-full items-center gap-4 rounded-lg border p-5 text-left transition-all hover:border-border-strong hover:bg-surface-2 ${
                isEnterprise
                  ? 'bg-accent/5 border-accent/30 shadow-card'
                  : 'bg-surface border-border shadow-card'
              }`}
            >
              {/* Avatar */}
              <span
                aria-hidden="true"
                className={`font-serif flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-2xl ${
                  isEnterprise
                    ? 'bg-accent/10 border-accent/40 text-accent-fg ring-1 ring-accent/20'
                    : 'bg-surface-2 border-border-strong text-fg'
                }`}
              >
                {initials(p.name)}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1.5">
                {/* Name row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-fg-strong font-medium">{p.name}</span>
                  <span className={`text-2xs uppercase tracking-[0.12em] ${TIER_STYLES[p.tier]}`}>
                    {p.tier}
                  </span>
                  {p.vip && (
                    <span className="bg-accent/20 text-accent-fg rounded-md px-2 py-0.5 text-2xs uppercase tracking-[0.12em]">
                      VIP
                    </span>
                  )}
                </div>

                {/* Scenario / hook line */}
                <p className="text-fg-muted truncate text-sm italic">
                  &ldquo;{p.hookLine}&rdquo;
                </p>

                {/* Intent preview chip */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-medium ring-1 ring-inset ${intentStyle}`}
                  >
                    <span aria-hidden="true">{intentSymbol}</span>
                    {intentLabel}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <span
                aria-hidden="true"
                className="text-fg-subtle group-hover:text-fg-muted shrink-0 transition-all group-hover:translate-x-0.5"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
