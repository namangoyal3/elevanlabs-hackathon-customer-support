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
    <main className="bg-bg text-fg flex h-dvh flex-col overflow-hidden">
      <h1 className="sr-only">NovaPay Support agent dashboard — CallPilot co-pilot</h1>

      {/* Header */}
      <header className="bg-surface border-border flex items-center justify-between border-b px-6 py-5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-2xl tracking-tight" aria-hidden="true">NovaPay</span>
          <span className="text-fg text-2xs uppercase tracking-[0.2em]" aria-hidden="true">
            CallPilot
          </span>
        </div>
        <div className="flex items-center gap-4">
          {status === 'active' && (
            <span className="bg-alert/15 border-alert/30 text-alert-fg flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <span className="bg-alert animate-pulse-dot h-1.5 w-1.5 rounded-full" aria-hidden="true" />
              <span className="text-2xs uppercase tracking-[0.12em]">Live</span>
              <span className="font-mono tabular-nums" data-nums>{timer}</span>
            </span>
          )}
          {status === 'ended' && (
            <span className="text-fg-muted text-2xs uppercase tracking-[0.12em]">Call ended</span>
          )}
          {pilot.status === 'connecting' && (
            <span className="bg-fg-subtle/10 text-fg-muted flex items-center gap-2 rounded-full border border-border px-3 py-1 text-2xs uppercase tracking-[0.12em]">
              Connecting…
            </span>
          )}
          {pilot.error && <span className="text-alert-fg text-sm">{pilot.error}</span>}
          <CallControls status={status} onStart={onStart} onEnd={onEnd} onReset={reset} />
        </div>
      </header>

      {escalationRisk && <EscalationAlert onDismiss={dismissEscalation} />}

      {/* Main body */}
      {status === 'idle' ? (
        <div className="flex flex-1 items-center p-8">
          <PersonaPicker onPick={onPickPersona} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden p-5 md:grid-cols-5">
          <section className="flex min-h-0 flex-col gap-4 md:col-span-2">
            {contact && <CallerBrief contact={contact} />}
            <LiveTranscript chunks={transcript} status={status} />
            {status !== 'pre_call' && <SentimentBar score={sentimentScore} />}
          </section>

          <section className="flex min-h-0 flex-col gap-4 overflow-y-auto md:col-span-3">
            {status === 'ended' ? (
              <PostCallSummary summary={summary} />
            ) : (
              <>
                {status === 'pre_call' && (
                  <div className="bg-surface border-border rounded-lg border px-4 py-2.5">
                    <p className="text-fg-muted text-sm">
                      <span className="text-fg-subtle font-mono text-2xs uppercase tracking-[0.12em]">Pre-call</span>
                      <span className="text-fg-subtle mx-2">·</span>
                      Pre-loaded from call history. Press{' '}
                      <span className="text-fg font-medium">Start call</span>{' '}
                      to begin live analysis.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <IntentBadge label={intentLabel} confidence={intentConfidence} />
                </div>
                {kbCards.length === 0 ? (
                  <p className="text-fg-muted text-sm italic">No articles surfaced yet.</p>
                ) : (
                  kbCards.slice(0, 2).map((c, i) => <KbCard key={c.id} article={c} rank={i + 1} />)
                )}
                <SuggestedReplies replies={suggestedReplies} />
              </>
            )}
          </section>
        </div>
      )}

      <DemoCycler />
    </main>
  );
}
