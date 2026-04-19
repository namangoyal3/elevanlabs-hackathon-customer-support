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

function formatRelativeDate(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

export function CallerBrief({ contact }: Props) {
  const isEnterprise = contact.tier === 'enterprise';
  const isVip = contact.vip;
  const avatarRing = isEnterprise || isVip ? 'ring-1 ring-accent/40' : 'ring-1 ring-border-strong';

  return (
    <section className="border-border bg-surface shadow-card animate-rise-in overflow-hidden rounded-lg border">
      {/* Header zone — accent tint for enterprise */}
      <div className={`flex items-start justify-between gap-4 p-5 ${isEnterprise ? 'bg-accent/5' : ''}`}>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`bg-surface-2 text-fg font-serif flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${avatarRing}`}
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
            {isEnterprise && (
              <span aria-hidden="true" className="text-accent-fg mr-1 text-[9px]">●</span>
            )}
            {TIER_LABELS[contact.tier]}
          </span>
          {isVip && (
            <span className="bg-accent text-accent-fg rounded-md px-2 py-0.5 text-2xs uppercase tracking-wider">
              VIP
            </span>
          )}
        </div>
      </div>

      {/* Open tickets */}
      <div className="px-5 pb-4">
        <p className="text-fg-subtle border-border mb-3 border-b pb-2 text-2xs uppercase tracking-[0.12em]">
          Open tickets
        </p>
        {contact.openTickets.length === 0 ? (
          <p className="text-fg-subtle text-sm italic">No open tickets</p>
        ) : (
          <ul className="space-y-1.5">
            {contact.openTickets.map((t) => (
              <li key={t.id} className="flex items-baseline gap-2 text-sm leading-snug">
                <span className="bg-surface-2 text-fg-muted font-mono text-2xs shrink-0 rounded-sm px-2 py-1 leading-none">
                  {t.id}
                </span>
                <span className="text-fg">{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Call history */}
      {contact.callHistory.length > 0 && (
        <div className="border-border border-t px-5 py-4">
          <p className="text-fg-subtle border-border mb-3 border-b pb-2 text-2xs uppercase tracking-[0.12em]">
            Recent contact
          </p>
          <ul className="space-y-1.5">
            {contact.callHistory.slice(0, 3).map((h, i) => (
              <li key={`${h.date}-${i}`} className="text-sm leading-snug">
                <time className="text-fg-muted font-mono text-2xs" dateTime={h.date}>
                  {formatRelativeDate(h.date)}
                </time>
                <span className="text-fg-subtle mx-1.5">—</span>
                <span className="text-fg">{h.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
