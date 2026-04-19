'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { KbCard } from '@/components/KbCard';
import { SentimentBar } from '@/components/SentimentBar';
import { IntentBadge } from '@/components/IntentBadge';
import { SuggestedReplies } from '@/components/SuggestedReplies';
import type { KbArticle } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LocalChunk {
  id: number;
  speaker: 'agent' | 'customer';
  text: string;
  timestamp: number;
}

// ── Demo transcript (NovaPay UPI failure scenario) ────────────────────────────

const DEMO_LINES: Omit<LocalChunk, 'id' | 'timestamp'>[] = [
  { speaker: 'customer', text: 'Hi, I really need help. My UPI payment of ₹8,500 failed yesterday but the money was already debited from my NovaPay account.' },
  { speaker: 'agent',    text: "I'm sorry to hear that. Let me look into this right away for you. Can I get your registered mobile number or account ID?" },
  { speaker: 'customer', text: "It's NPY-78432. I'm a Premium member. The payment was to Swiggy Instamart and I still have pending groceries." },
  { speaker: 'agent',    text: 'Got it, I can see your account now. The transaction is showing a pending status on our end.' },
  { speaker: 'customer', text: 'How long is this going to take? I need this resolved today, not in three days.' },
  { speaker: 'agent',    text: 'I understand. Typically these auto-resolve in 24 to 48 hours but let me see what I can do for you.' },
  { speaker: 'customer', text: "That's absolutely unacceptable. Every time I call NovaPay I get the same runaround. I want to speak to a supervisor now." },
  { speaker: 'agent',    text: "I completely understand your frustration. Let me escalate this to our senior team who can initiate a priority refund." },
  { speaker: 'customer', text: 'Will there be any compensation? This has caused me real inconvenience and stress.' },
  { speaker: 'agent',    text: "Absolutely, I'll make a note of that. Our senior team can authorise cashback for Premium members in situations like this." },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// Safely get SpeechRecognition constructor across browsers
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function GoogleMeetPage() {
  // Stable callId for this page session
  const callId = useMemo(
    () => `gm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isListening, setIsListening]       = useState(false);
  const [micAvailable, setMicAvailable]     = useState<boolean | null>(null);
  const [transcript, setTranscript]         = useState<LocalChunk[]>([]);
  const [speaker, setSpeaker]               = useState<'agent' | 'customer'>('customer');
  const [inputText, setInputText]           = useState('');
  const [elapsed, setElapsed]               = useState(0);
  const [demoPlaying, setDemoPlaying]       = useState(false);
  const [sessionActive, setSessionActive]   = useState(false);

  // ── Analysis state — driven by real SSE from /api/stream ─────────────────
  const [kbCards, setKbCards]               = useState<KbArticle[]>([]);
  const [intent, setIntent]                 = useState('');
  const [intentConfidence, setIntentConf]   = useState(0);
  const [sentiment, setSentiment]           = useState(0);
  const [suggestedReplies, setReplies]      = useState<string[]>([]);
  const [escalation, setEscalation]         = useState(false);

  const chunkId        = useRef(0);
  const transcriptEnd  = useRef<HTMLDivElement>(null);
  const demoTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognition    = useRef<SpeechRecognition | null>(null);
  // Keep a ref in sync with `speaker` so the SpeechRecognition callback
  // always reads the current value without needing to restart the session.
  const speakerRef     = useRef<'agent' | 'customer'>('customer');

  // ── Check mic availability on mount ───────────────────────────────────────
  useEffect(() => {
    setMicAvailable(getSpeechRecognition() !== null);
  }, []);

  // Keep speakerRef in sync so SpeechRecognition callbacks always read current
  useEffect(() => { speakerRef.current = speaker; }, [speaker]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionActive) {
      elapsedTimer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    }
    return () => { if (elapsedTimer.current) clearInterval(elapsedTimer.current); };
  }, [sessionActive]);

  // ── Auto-scroll transcript ────────────────────────────────────────────────
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // ── SSE subscription — receive real analysis from backend ─────────────────
  useEffect(() => {
    const es = new EventSource(`/api/stream?callId=${encodeURIComponent(callId)}`);

    es.addEventListener('intent', (e: MessageEvent) => {
      const d = JSON.parse(e.data as string) as { label: string; confidence: number };
      setIntent(d.label);
      setIntentConf(d.confidence);
    });

    es.addEventListener('kb_update', (e: MessageEvent) => {
      const d = JSON.parse(e.data as string) as { articles: KbArticle[] };
      setKbCards(d.articles.slice(0, 2));
    });

    es.addEventListener('sentiment', (e: MessageEvent) => {
      const d = JSON.parse(e.data as string) as { score: number };
      setSentiment(d.score);
    });

    es.addEventListener('escalation', () => setEscalation(true));

    es.addEventListener('suggested_replies', (e: MessageEvent) => {
      const d = JSON.parse(e.data as string) as { replies: string[] };
      setReplies(d.replies);
    });

    return () => es.close();
  }, [callId]);

  // ── Post a transcript chunk to the backend ────────────────────────────────
  const addChunk = useCallback(
    async (spk: 'agent' | 'customer', text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const chunk: LocalChunk = {
        id: ++chunkId.current,
        speaker: spk,
        text: trimmed,
        timestamp: Date.now(),
      };
      setTranscript((prev) => [...prev, chunk]);
      if (!sessionActive) setSessionActive(true);

      try {
        await fetch('/api/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId, speaker: spk, text: trimmed, timestamp: chunk.timestamp }),
        });
      } catch {
        // Silent: local UI already updated — backend analysis is secondary
      }
    },
    [callId, sessionActive],
  );

  // ── Web Speech API ────────────────────────────────────────────────────────
  const startMic = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = 'en-IN';

    r.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal && last[0].transcript.trim()) {
        // speakerRef.current always reflects the current selector value
        void addChunk(speakerRef.current, last[0].transcript.trim());
      }
    };

    r.onerror = () => {
      setIsListening(false);
      recognition.current = null;
    };

    r.start();
    recognition.current = r;
    setIsListening(true);
  }, [addChunk, speakerRef]);

  const stopMic = useCallback(() => {
    recognition.current?.stop();
    recognition.current = null;
    setIsListening(false);
  }, []);

  // ── Demo mode — routes all chunks through real backend ────────────────────
  const runDemoStep = useCallback(
    (idx: number) => {
      if (idx >= DEMO_LINES.length) {
        setDemoPlaying(false);
        return;
      }
      const line = DEMO_LINES[idx];
      void addChunk(line.speaker, line.text);
      const delay = line.speaker === 'customer' ? 4200 : 2800;
      demoTimer.current = setTimeout(() => runDemoStep(idx + 1), delay);
    },
    [addChunk],
  );

  const startDemo = useCallback(() => {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setTranscript([]);
    setKbCards([]);
    setReplies([]);
    setEscalation(false);
    setIntent('');
    setIntentConf(0);
    setSentiment(0);
    setElapsed(0);
    setDemoPlaying(true);
    setSessionActive(true);
    demoTimer.current = setTimeout(() => runDemoStep(0), 600);
  }, [runDemoStep]);

  const stopDemo = useCallback(() => {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setDemoPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (demoTimer.current) clearTimeout(demoTimer.current);
      stopMic();
    },
    [stopMic],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void addChunk(speaker, inputText);
    setInputText('');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-bg text-fg flex min-h-screen flex-col">

      {/* ── Header ── */}
      <header className="bg-surface border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Google Meet coloured dots */}
          <div className="flex items-center gap-2.5">
            <span className="flex gap-[3px]" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              <span className="h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-fg text-sm font-semibold">Google Meet · AI Co-pilot</span>
          </div>

          {sessionActive && (
            <div className="text-fg-muted flex items-center gap-1.5 font-mono text-2xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {isListening ? 'Listening' : 'Active'} · {formatDuration(elapsed)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {escalation && (
            <span className="border-alert/40 bg-alert/20 text-alert-fg animate-pulse rounded-full border px-3 py-1 text-xs font-medium">
              ⚠ Escalation risk
            </span>
          )}

          {demoPlaying ? (
            <button
              onClick={stopDemo}
              className="border-border text-fg-muted hover:text-fg rounded border px-3 py-1.5 text-xs transition-colors"
            >
              Stop demo
            </button>
          ) : (
            <button
              onClick={startDemo}
              className="bg-accent text-accent-fg hover:bg-accent/90 rounded px-3 py-1.5 text-xs font-medium transition-colors"
            >
              ▶ Run demo
            </button>
          )}

          <a href="/" className="text-fg-subtle hover:text-fg text-xs transition-colors">
            ← Home
          </a>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: Meet simulation + transcript ── */}
        <div className="border-border flex w-1/2 flex-col overflow-hidden border-r">

          {/* Simulated camera tiles */}
          <div className="border-border flex gap-2 border-b bg-[#202124] p-3">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-[#3c4043] aspect-video">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">A</div>
              <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px]">
                Agent (You)
              </span>
              {isListening && (
                <span
                  className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-red-400"
                  title="Microphone active"
                />
              )}
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-[#3c4043] aspect-video">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-lg font-bold">C</div>
              <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px]">
                Customer
              </span>
            </div>
          </div>

          {/* Transcript scroll */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <p className="text-fg-subtle font-mono text-2xs uppercase tracking-[0.14em]">
              Live transcript
            </p>

            {transcript.length === 0 && (
              <div className="mt-12 text-center">
                <p className="text-fg-muted text-sm">No transcript yet.</p>
                <p className="text-fg-subtle mt-1 text-xs">
                  Click <strong className="text-fg-muted">Run demo</strong>, start the mic, or type below.
                </p>
              </div>
            )}

            {transcript.map((chunk) => (
              <div
                key={chunk.id}
                className={`flex gap-2 ${chunk.speaker === 'agent' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    chunk.speaker === 'agent' ? 'bg-blue-600' : 'bg-orange-600'
                  }`}
                >
                  {chunk.speaker === 'agent' ? 'A' : 'C'}
                </div>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 ${
                    chunk.speaker === 'agent'
                      ? 'border border-blue-600/30 bg-blue-600/10'
                      : 'bg-surface border-border border'
                  }`}
                >
                  <p className="text-fg-subtle mb-0.5 text-[10px]">
                    {chunk.speaker === 'agent' ? 'Agent' : 'Customer'} ·{' '}
                    {new Date(chunk.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                  <p className="text-fg text-sm leading-relaxed">{chunk.text}</p>
                </div>
              </div>
            ))}
            <div ref={transcriptEnd} />
          </div>

          {/* Input controls */}
          <div className="bg-surface border-border space-y-2 border-t p-3">
            <div className="flex items-center gap-2">
              {/* Mic button */}
              {micAvailable ? (
                <button
                  onClick={isListening ? stopMic : startMic}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    isListening
                      ? 'border-alert/40 bg-alert/20 text-alert-fg border'
                      : 'border-border bg-surface-2 text-fg-muted hover:text-fg border'
                  }`}
                >
                  {isListening ? '⬛ Stop mic' : '🎤 Start mic'}
                </button>
              ) : (
                <span className="text-fg-subtle rounded border border-dashed px-3 py-1.5 text-xs">
                  Mic: Chrome only
                </span>
              )}

              {/* Speaker selector */}
              <select
                id="gm-speaker-select"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value as 'agent' | 'customer')}
                className="bg-bg border-border text-fg focus:border-accent rounded border px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="customer">Customer</option>
                <option value="agent">Agent</option>
              </select>
              <span className="text-fg-subtle text-xs">speaking</span>
            </div>

            {/* Manual text input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a transcript line…"
                className="bg-bg border-border placeholder:text-fg-subtle text-fg focus:border-accent flex-1 rounded border px-3 py-1.5 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-accent text-accent-fg hover:bg-accent/90 rounded px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* ── Right panel: AI Co-pilot ── */}
        <div className="flex w-1/2 flex-col overflow-hidden">
          <div className="border-border border-b p-4">
            <h2 className="text-fg text-sm font-semibold">AI Co-pilot</h2>
            <p className="text-fg-muted mt-0.5 text-xs">
              Real-time intent · KB retrieval · Suggested replies · Sentiment
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">

            {/* Intent badge */}
            <IntentBadge label={intent} confidence={intentConfidence} />

            {/* Sentiment */}
            <SentimentBar score={sentiment} />

            {/* KB cards */}
            {kbCards.length > 0 ? (
              <div className="space-y-3">
                {kbCards.map((card, i) => (
                  <KbCard key={card.id} article={card} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div className="border-border bg-surface shadow-card rounded-lg border p-5 text-center">
                <p className="text-fg-muted text-sm">KB articles will appear once intent is detected.</p>
                <p className="text-fg-subtle mt-1 text-xs">
                  Start speaking or run the demo to trigger RAG retrieval.
                </p>
              </div>
            )}

            {/* Suggested replies */}
            <SuggestedReplies replies={suggestedReplies} />
          </div>

          {/* Footer: how it works */}
          <div className="bg-surface border-border border-t p-3">
            <p className="text-fg-subtle text-[10px] leading-relaxed">
              <span className="text-fg-muted font-medium">How it works — </span>
              Each transcript line is sent to the NovaPay KB pipeline: NVIDIA Nemotron detects
              intent, pgvector RAG surfaces the top KB articles, and suggested replies are
              generated — all streamed back via Server-Sent Events in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
