import type { Contact } from '@/types';

interface Props {
  contact: Contact;
}

const TIER_LABELS: Record<Contact['tier'], string> = {
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const TIER_STYLES: Record<Contact['tier'], string> = {
  standard: 'border-border text-fg-muted',
  premium: 'border-border-strong text-fg',
  enterprise: 'border-accent/40 text-accent-fg bg-accent/10',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function CallerBrief({ contact }: Props) {
  return (
    <section className="border-border bg-surface shadow-card animate-rise-in rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="bg-surface-2 border-border-strong text-fg font-serif flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg"
          >
            {initials(contact.name)}
          </span>
          <div>
            <h2 className="font-serif text-[22px] leading-tight tracking-tight">{contact.name}</h2>
            <p className="text-fg-subtle font-mono text-2xs mt-0.5">
              {contact.id} · {contact.phone}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <span className={`rounded-sm border px-2 py-0.5 text-2xs uppercase tracking-wider ${TIER_STYLES[contact.tier]}`}>
            {TIER_LABELS[contact.tier]}
          </span>
          {contact.vip && (
            <span className="bg-accent text-accent-fg rounded-sm px-2 py-0.5 text-2xs uppercase tracking-wider">
              VIP
            </span>
          )}
        </div>
      </div>

      {contact.openTickets.length > 0 && (
        <div className="mt-4">
          <p className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Open tickets</p>
          <ul className="mt-1.5 space-y-1">
            {contact.openTickets.map((t) => (
              <li key={t.id} className="text-sm leading-snug">
                <span className="text-fg-muted font-mono text-2xs">{t.id}</span>
                <span className="mx-1.5 text-fg-subtle">·</span>
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {contact.callHistory.length > 0 && (
        <div className="mt-4">
          <p className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Recent contact</p>
          <ul className="mt-1.5 space-y-1">
            {contact.callHistory.slice(0, 3).map((h, i) => (
              <li key={`${h.date}-${i}`} className="text-sm leading-snug">
                <time className="text-fg-muted font-mono text-2xs" dateTime={h.date}>
                  {h.date}
                </time>
                <span className="mx-1.5 text-fg-subtle">—</span>
                {h.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
