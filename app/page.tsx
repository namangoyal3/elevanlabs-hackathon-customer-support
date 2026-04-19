import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-12">
      <h1 className="font-serif text-5xl">CallPilot</h1>
      <p className="text-muted max-w-md text-center">
        AI co-pilot for customer support agents. Real-time KB retrieval, live transcript,
        sentiment, and post-call summaries — built on ElevenLabs and Claude.
      </p>
      <div className="flex gap-3">
        <Link
          href="/agent"
          className="bg-accent rounded-md px-5 py-2 font-medium hover:opacity-90"
        >
          Open Agent Dashboard →
        </Link>
        <Link
          href="/google-meet"
          className="rounded-md px-5 py-2 font-medium border border-border hover:border-accent hover:text-white text-muted transition-colors flex items-center gap-2"
        >
          <span className="flex gap-[3px] items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </span>
          Google Meet Mode →
        </Link>
      </div>
    </main>
  );
}
