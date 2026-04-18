import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-12">
      <h1 className="font-serif text-5xl">CallPilot</h1>
      <p className="text-muted max-w-md text-center">
        AI co-pilot for customer support agents. Real-time KB retrieval, live transcript,
        sentiment, and post-call summaries — built on ElevenLabs and Claude.
      </p>
      <Link
        href="/agent"
        className="bg-accent rounded-md px-5 py-2 font-medium hover:opacity-90"
      >
        Open Agent Dashboard →
      </Link>
    </main>
  );
}
