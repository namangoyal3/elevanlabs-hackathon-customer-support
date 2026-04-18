'use client';

import { useEffect, useState } from 'react';
import type { KbArticle } from '@/types';
import { useCallStore } from '@/lib/store';
import type { DemoPersona } from '@/lib/demo-personas';

import { PersonaPicker } from '@/components/PersonaPicker';
import { CallerBrief } from '@/components/CallerBrief';
import { LiveTranscript } from '@/components/LiveTranscript';
import { SentimentBar } from '@/components/SentimentBar';
import { IntentBadge } from '@/components/IntentBadge';
import { KbCard } from '@/components/KbCard';
import { SuggestedReplies } from '@/components/SuggestedReplies';
import { EscalationAlert } from '@/components/EscalationAlert';
import { PostCallSummary } from '@/components/PostCallSummary';
import { CallControls } from '@/components/CallControls';
import { DemoCycler } from '@/components/DemoCycler';

async function fetchPreloadedKb(ids: string[]): Promise<KbArticle[]> {
  if (ids.length === 0) return [];
  const res = await fetch(`/api/kb/preload?ids=${encodeURIComponent(ids.join(','))}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { articles: KbArticle[] };
  return json.articles ?? [];
}

function useCallTimer(active: boolean): string {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function AgentDashboardPage() {
  const status = useCallStore((s) => s.status);
  const contact = useCallStore((s) => s.contact);
  const transcript = useCallStore((s) => s.transcript);
  const kbCards = useCallStore((s) => s.kbCards);
  const sentimentScore = useCallStore((s) => s.sentimentScore);
  const intentLabel = useCallStore((s) => s.intentLabel);
  const intentConfidence = useCallStore((s) => s.intentConfidence);
  const escalationRisk = useCallStore((s) => s.escalationRisk);
  const suggestedReplies = useCallStore((s) => s.suggestedReplies);
  const summary = useCallStore((s) => s.summary);

  const pickPersona = useCallStore((s) => s.pickPersona);
  const startCall = useCallStore((s) => s.startCall);
  const endCall = useCallStore((s) => s.endCall);
  const reset = useCallStore((s) => s.reset);
  const dismissEscalation = useCallStore((s) => s.dismissEscalation);

  const timer = useCallTimer(status === 'active');

  const onPickPersona = async (p: DemoPersona) => {
    pickPersona(p);
    const preloaded = await fetchPreloadedKb(p.predictedKbIds);
    if (preloaded.length > 0) {
      useCallStore.getState().setKbCards(preloaded);
    }
  };

  const onStart = () => {
    const id = `demo-call-${Math.random().toString(36).slice(2, 10)}`;
    startCall(id);
  };

  return (
    <main className="bg-bg flex min-h-screen flex-col text-white">
      {/* Header */}
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-lg">NovaPay Support</span>
          <span className="text-muted text-xs">CallPilot co-pilot</span>
        </div>
        <div className="flex items-center gap-4">
          {status === 'active' && (
            <span className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              LIVE · <span className="font-mono">{timer}</span>
            </span>
          )}
          {status === 'ended' && <span className="text-muted text-sm">Call ended</span>}
          <CallControls status={status} onStart={onStart} onEnd={endCall} onReset={reset} />
        </div>
      </header>

      {escalationRisk && <EscalationAlert onDismiss={dismissEscalation} />}

      {/* Main body */}
      {status === 'idle' ? (
        <div className="flex flex-1 items-center p-6">
          <PersonaPicker onPick={onPickPersona} />
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-5 gap-4 overflow-hidden p-4">
          {/* Left column — 40% */}
          <section className="col-span-2 flex min-h-0 flex-col gap-3">
            {contact && <CallerBrief contact={contact} />}
            <LiveTranscript chunks={transcript} />
            {status !== 'pre_call' && <SentimentBar score={sentimentScore} />}
          </section>

          {/* Right column — 60% */}
          <section className="col-span-3 flex min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="flex items-center gap-3">
              <IntentBadge label={intentLabel} confidence={intentConfidence} />
              {status === 'pre_call' && (
                <span className="text-muted text-xs italic">Pre-loaded from call history</span>
              )}
            </div>
            {kbCards.length === 0 ? (
              <p className="text-muted text-sm italic">No KB cards yet — listening…</p>
            ) : (
              kbCards.slice(0, 2).map((c, i) => <KbCard key={c.id} article={c} rank={i + 1} />)
            )}
            <SuggestedReplies replies={suggestedReplies} />
          </section>
        </div>
      )}

      {/* Post-call drawer */}
      {status === 'ended' && <PostCallSummary summary={summary} />}

      {/* Dev-only demo cycler (shown with ?demo=1) */}
      <DemoCycler />
    </main>
  );
}
