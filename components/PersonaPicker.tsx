'use client';

import { DEMO_PERSONAS, type DemoPersona } from '@/lib/demo-personas';

interface Props {
  onPick: (persona: DemoPersona) => void;
}

export function PersonaPicker({ onPick }: Props) {
  return (
    <section className="border-border bg-surface mx-auto max-w-2xl rounded-lg border p-6">
      <h2 className="font-serif text-2xl">Pick a demo customer</h2>
      <p className="text-muted mt-1 text-sm">
        Each persona maps to one of the three PRD demo scenarios. Picking one
        loads their pre-call brief and the predicted KB articles.
      </p>
      <ul className="mt-4 space-y-3">
        {DEMO_PERSONAS.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onPick(p)}
              className="border-border hover:border-accent flex w-full flex-col items-start gap-1 rounded-md border p-4 text-left transition-colors"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                <span className="text-muted font-mono text-xs">{p.tier}</span>
              </div>
              <span className="text-muted text-xs italic">
                Hook: "{p.hookLine}"
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
