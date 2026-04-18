'use client';

import { useEffect, useRef, useState } from 'react';
import type { KbArticle, TranscriptChunk } from '@/types';
import { useCallStore } from '@/lib/store';
import { useCallPilot } from '@/lib/elevenlabs-agent';
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

/** Open an EventSource for `callId`, dispatching parsed events into the store.
 *  Auto-closes on unmount. */
function useSseSubscription(callId: string | null) {
  const applyTranscript = useCallStore((s) => s.appendTranscript);
  const setKbCards = useCallStore((s) => s.setKbCards);
  const setSentiment = useCallStore((s) => s.setSentiment);
  const setIntent = useCallStore((s) => s.setIntent);
  const triggerEscalation = useCallStore((s) => s.triggerEscalation);
  const setSuggestedReplies = useCallStore((s) => s.setSuggestedReplies);
  const setSummary = useCallStore((s) => s.setSummary);

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!callId) return;
    const es = new EventSource(`/api/stream?callId=${encodeURIComponent(callId)}`);
    esRef.current = es;

    const onTranscript = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as { chunk: TranscriptChunk };
        if (payload.chunk) applyTranscript(payload.chunk);
      } catch {}
    };
    const onIntent = (e: MessageEvent) => {
      try {
        const p = JSON.parse(e.data) as { label: string; confidence: number };
        setIntent(p.label, p.confidence);
      } catch {}
    };
    const onKbUpdate = (e: MessageEvent) => {
      try {
        const p = JSON.parse(e.data) as { articles: KbArticle[] };
        if (p.articles?.length) setKbCards(p.articles);
      } catch {}
    };
    const onSentiment = (e: MessageEvent) => {
      try {
        const p = JSON.parse(e.data) as { score: number };
        setSentiment(p.score);
      } catch {}
    };
    const onEscalation = () => triggerEscalation();
    const onReplies = (e: MessageEvent) => {
      try {
        const p = JSON.parse(e.data) as { replies: string[] };
        setSuggestedReplies(p.replies);
      } catch {}
    };
    const onSummary = (e: MessageEvent) => {
      try {
        const p = JSON.parse(e.data) as { summary: Parameters<typeof setSummary>[0] };
        if (p.summary) setSummary(p.summary);
      } catch {}
    };

    es.addEventListener('transcript', onTranscript);
    es.addEventListener('intent', onIntent);
    es.addEventListener('kb_update', onKbUpdate);
    es.addEventListener('sentiment', onSentiment);
    es.addEventListener('escalation', onEscalation);
    es.addEventListener('suggested_replies', onReplies);
    es.addEventListener('post_call_summary', onSummary);

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [
    callId,
    applyTranscript,
    setKbCards,
    setSentiment,
    setIntent,
    triggerEscalation,
    setSuggestedReplies,
    setSummary,
  ]);
}

export default function AgentDashboardPage() {
  const status = useCallStore((s) => s.status);
  const callId = useCallStore((s) => s.callId);
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
  const reset = useCallStore((s) => s.reset);
  const dismissEscalation = useCallStore((s) => s.dismissEscalation);

  const pilot = useCallPilot();
  const timer = useCallTimer(status === 'active');

  useSseSubscription(callId);

  const [pickedPersona, setPickedPersona] = useState<DemoPersona | null>(null);

  const onPickPersona = async (p: DemoPersona) => {
    setPickedPersona(p);
    pickPersona(p);
    const preloaded = await fetchPreloadedKb(p.predictedKbIds);
    if (preloaded.length > 0) useCallStore.getState().setKbCards(preloaded);
  };

  const onStart = async () => {
    if (!pickedPersona) return;
    await pilot.start(pickedPersona);
  };

  const onEnd = async () => {
    await pilot.stop();
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
          {pilot.status === 'connecting' && <span className="text-muted text-sm">Connecting…</span>}
          {pilot.error && <span className="text-red-400 text-sm">{pilot.error}</span>}
          <CallControls status={status} onStart={onStart} onEnd={onEnd} onReset={reset} />
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
          <section className="col-span-2 flex min-h-0 flex-col gap-3">
            {contact && <CallerBrief contact={contact} />}
            <LiveTranscript chunks={transcript} />
            {status !== 'pre_call' && <SentimentBar score={sentimentScore} />}
          </section>

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

      {status === 'ended' && <PostCallSummary summary={summary} />}

      <DemoCycler />
    </main>
  );
}
