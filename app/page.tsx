import Link from 'next/link';

const CAPABILITIES = [
  'Live transcript',
  'Sentiment analysis',
  'KB retrieval',
  'Post-call AI summary',
];

export default function HomePage() {
  return (
    <main className="bg-bg text-fg flex min-h-screen flex-col">
      {/* Nav strip */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-xl tracking-tight">NovaPay</span>
          <span className="text-fg-subtle font-mono text-2xs uppercase tracking-[0.2em]">CallPilot</span>
        </div>
        <span className="text-fg-subtle font-mono text-2xs">v0.1</span>
      </nav>

      {/* Hero */}
      <div className="flex flex-1 items-center px-8 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 md:grid-cols-2 md:gap-24">

          {/* Left — editorial */}
          <div className="flex flex-col justify-center gap-8">
            <div className="space-y-3">
              <p className="text-fg-subtle font-mono text-2xs uppercase tracking-[0.22em]">
                Incoming · AI co-pilot
              </p>
              <h1 className="font-serif text-7xl leading-[0.9] tracking-tight md:text-8xl">
                Every call,<br />heard in full.
              </h1>
            </div>

            <p className="text-fg-muted max-w-sm text-base leading-relaxed">
              Real-time intelligence for support agents — transcript, sentiment,
              KB retrieval, and post-call summaries, live in the room.
            </p>

            {/* Capability chips */}
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map((cap) => (
                <span
                  key={cap}
                  className="bg-surface border-border text-fg-muted rounded-full border px-3.5 py-1 text-2xs"
                >
                  {cap}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start">
              <Link
                href="/agent"
                className="bg-accent text-accent-fg shadow-card hover:bg-accent/90 inline-flex items-center gap-2.5 rounded-lg px-6 py-3 text-base font-medium transition-colors"
              >
                Open dashboard
                <span aria-hidden="true" className="text-accent-fg/70">→</span>
              </Link>
              <div className="flex flex-col gap-1">
                <Link
                  href="/agent?demo=1"
                  className="border-border-strong text-fg-muted hover:bg-surface hover:text-fg inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-base transition-colors"
                >
                  Demo mode
                </Link>
                <span className="text-fg-subtle font-mono text-center text-2xs">
                  No setup required
                </span>
              </div>
            </div>
            <Link
              href="/google-meet"
              className="border-border text-fg-muted hover:border-border-strong hover:text-fg inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm transition-colors"
            >
              <span className="flex gap-[3px]">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              </span>
              Google Meet Co-pilot →
            </Link>
          </div>

          {/* Right — live capability preview (static mockup) */}
          <div className="hidden flex-col justify-center gap-3 md:flex">

            {/* Transcript card */}
            <div className="bg-surface border-border shadow-card rounded-lg border p-4">
              <p className="text-fg-subtle font-mono mb-3 text-2xs uppercase tracking-[0.14em]">Live transcript</p>
              <div className="space-y-2.5">
                <div className="border-l-[3px] border-accent/50 bg-gradient-to-r from-accent/5 to-transparent pl-3">
                  <span className="text-fg-subtle text-2xs">Agent</span>
                  <p className="text-fg text-sm leading-snug">Thank you for calling NovaPay. How can I help you today?</p>
                </div>
                <div className="border-l-[3px] border-amber-400/40 bg-gradient-to-r from-amber-400/5 to-transparent pl-3">
                  <span className="text-fg-subtle text-2xs">Customer</span>
                  <p className="text-fg text-sm leading-snug">My UPI payment of ₹4,500 failed but the money was debited.</p>
                </div>
              </div>
            </div>

            {/* KB + sentiment row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border-border shadow-card rounded-lg border p-4">
                <p className="text-fg-subtle font-mono mb-2.5 text-2xs uppercase tracking-[0.14em]">KB retrieved</p>
                <div className="flex items-start gap-2.5">
                  <span className="bg-accent text-accent-fg flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold">1</span>
                  <div>
                    <p className="text-fg text-xs font-medium leading-snug">Failed Transaction Policy</p>
                    <p className="text-fg-muted mt-0.5 text-2xs">Refunds processed within 3–5 business days…</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface border-border shadow-card rounded-lg border p-4">
                <p className="text-fg-subtle font-mono mb-2.5 text-2xs uppercase tracking-[0.14em]">Sentiment</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-fg text-sm font-medium">Frustrated</span>
                    <span className="text-fg-subtle font-mono text-2xs" data-nums>−0.42</span>
                  </div>
                  <div className="bg-surface-2 h-2.5 overflow-hidden rounded-full">
                    <div className="h-full w-[28%] rounded-full bg-alert/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Intent badge row */}
            <div className="bg-surface border-border shadow-card flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="text-fg-subtle text-2xs uppercase tracking-[0.12em]">Detected intent</span>
              <span className="bg-sky-500/10 text-sky-100 ring-sky-500/30 rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset">
                ↻ Failed transaction
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-border border-t px-8 py-4">
        <p className="text-fg-subtle font-mono text-center text-2xs">
          Powered by ElevenLabs · NVIDIA Nemotron · Supabase pgvector · v0.1
        </p>
      </footer>
    </main>
  );
}
