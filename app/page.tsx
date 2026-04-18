import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="bg-bg text-fg flex min-h-screen flex-col items-center justify-center gap-10 p-12">
      <div className="max-w-xl space-y-4 text-center">
        <p className="text-fg-subtle text-2xs uppercase tracking-[0.22em]">NovaPay · CallPilot</p>
        <h1 className="font-serif text-6xl leading-[0.95] tracking-tight">
          The agent&rsquo;s second set of ears.
        </h1>
        <p className="text-fg-muted mx-auto max-w-md text-base leading-relaxed">
          Live transcript, KB retrieval, sentiment, and post-call summaries — built on
          ElevenLabs, NVIDIA Nemotron, and Supabase pgvector.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/agent"
          className="bg-accent text-accent-fg shadow-card hover:bg-accent/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Open dashboard <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/agent?demo=1"
          className="border-border-strong text-fg hover:bg-surface inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm transition-colors"
        >
          Demo mode
        </Link>
      </div>

      <p className="text-fg-subtle font-mono text-2xs">v0.1 · hackathon build</p>
    </main>
  );
}
