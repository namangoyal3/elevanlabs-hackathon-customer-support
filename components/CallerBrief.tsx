import type { Contact } from '@/types';

interface Props {
  contact: Contact;
}

const TIER_LABELS: Record<Contact['tier'], string> = {
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

export function CallerBrief({ contact }: Props) {
  return (
    <section className="border-border bg-surface rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-xl leading-tight">{contact.name}</h2>
          <p className="text-muted font-mono text-xs">
            #{contact.id} · {contact.phone}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="border-border rounded border px-2 py-0.5 text-xs">
            {TIER_LABELS[contact.tier]}
          </span>
          {contact.vip && (
            <span className="bg-accent rounded px-2 py-0.5 text-xs font-semibold">VIP</span>
          )}
        </div>
      </div>

      {contact.openTickets.length > 0 && (
        <div className="mt-3">
          <p className="text-muted text-xs uppercase tracking-wide">Open tickets</p>
          <ul className="mt-1 space-y-1">
            {contact.openTickets.map((t) => (
              <li key={t.id} className="text-sm">
                <span className="text-muted font-mono">{t.id}</span> · {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {contact.callHistory.length > 0 && (
        <div className="mt-3">
          <p className="text-muted text-xs uppercase tracking-wide">Recent contact</p>
          <ul className="mt-1 space-y-0.5">
            {contact.callHistory.slice(0, 3).map((h, i) => (
              <li key={`${h.date}-${i}`} className="text-sm">
                <span className="text-muted font-mono">{h.date}</span> — {h.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
