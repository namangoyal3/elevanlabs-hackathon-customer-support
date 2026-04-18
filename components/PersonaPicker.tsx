'use client';

import { DEMO_PERSONAS, type DemoPersona } from '@/lib/demo-personas';
import type { Contact } from '@/types';

interface Props {
  onPick: (persona: DemoPersona) => void;
}

const TIER_STYLES: Record<Contact['tier'], string> = {
  standard: 'text-fg-muted',
  premium: 'text-fg',
  enterprise: 'text-accent-fg',
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
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="text-fg-subtle text-2xs uppercase tracking-[0.16em]">Demo</p>
        <h2 className="font-serif mt-1 text-4xl leading-tight tracking-tight">
          Pick a customer to answer.
        </h2>
        <p className="text-fg-muted mt-3 max-w-lg text-sm leading-relaxed">
          Each profile mirrors one of the three PRD scenarios. Selecting a customer
          pre-loads their history and the articles the co-pilot expects to need.
        </p>
      </div>

      <ul className="border-border bg-surface shadow-card divide-border divide-y overflow-hidden rounded-lg border">
        {DEMO_PERSONAS.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onPick(p)}
              className="hover:bg-surface-2 group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors"
            >
              <span
                aria-hidden="true"
                className="bg-surface-2 border-border-strong text-fg font-serif flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-xl"
              >
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-fg-strong font-medium">{p.name}</span>
                  <span className={`text-2xs uppercase tracking-[0.12em] ${TIER_STYLES[p.tier]}`}>
                    {p.tier}
                  </span>
                  {p.vip && (
                    <span className="bg-accent/20 text-accent-fg rounded-sm px-1.5 py-0.5 text-2xs uppercase tracking-[0.12em]">
                      VIP
                    </span>
                  )}
                </div>
                <p className="text-fg-muted mt-1 truncate text-sm italic">
                  &ldquo;{p.hookLine}&rdquo;
                </p>
              </div>
              <span
                aria-hidden="true"
                className="text-fg-subtle group-hover:text-fg-muted shrink-0 text-lg transition-colors"
              >
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
