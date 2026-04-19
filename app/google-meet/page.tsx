'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranscriptChunk {
  id: number;
  speaker: 'Agent' | 'Customer';
  text: string;
  timestamp: string;
}

interface Suggestions {
  responseImprovement: string | null;
  missingInfo: string | null;
  toneAdvice: string | null;
  kbReference: string | null;
  nextAction: string | null;
  urgencyLevel: 'low' | 'medium' | 'high' | null;
}

// ─── Demo transcript (NovaPay UPI failure scenario) ───────────────────────────

const DEMO_TRANSCRIPT: Omit<TranscriptChunk, 'id' | 'timestamp'>[] = [
  { speaker: 'Customer', text: "Hi, I really need help. My UPI payment failed and the money got deducted from my account but the merchant didn't receive it." },
  { speaker: 'Agent',    text: "Okay, I'll look into that." },
  { speaker: 'Customer', text: "It was ₹8,500 to Swiggy Instamart. This is urgent, I need it resolved today. My groceries depend on it." },
  { speaker: 'Agent',    text: "Sure. What's your account number?" },
  { speaker: 'Customer', text: "It's NPY-78432. I'm a NovaPay Premium member by the way. This has never happened before and I'm really stressed." },
  { speaker: 'Agent',    text: "I can see the transaction. It shows a pending status on our end. It might resolve in 24-48 hours automatically." },
  { speaker: 'Customer', text: "24-48 hours?! That's not acceptable. I have no groceries at home. Is there anything faster you can do?" },
  { speaker: 'Agent',    text: "We can initiate a refund but that also takes 3-5 business days." },
  { speaker: 'Customer', text: "This is really frustrating. I rely on NovaPay for everything. Can I speak to a supervisor or get some kind of priority handling?" },
  { speaker: 'Agent',    text: "I can escalate but I'm not sure how fast that will be." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function urgencyColor(level: string | null) {
  if (level === 'high') return 'text-red-400 bg-red-400/10 border-red-400/30';
  if (level === 'medium') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
  return 'text-green-400 bg-green-400/10 border-green-400/30';
}

function tryParseJSON(raw: string): Suggestions | null {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1)) as Suggestions;
  } catch {
    return null;
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function SuggestionCard({ label, value, accent }: { label: string; value: string | null; accent: string }) {
  if (!value) return null;
  return (
    <div className={`rounded-lg border p-3 ${accent}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GoogleMeetPage() {
  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputSpeaker, setInputSpeaker] = useState<'Agent' | 'Customer'>('Customer');
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [rawStream, setRawStream] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkId = useRef(0);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Elapsed timer
  useEffect(() => {
    if (connected) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [connected]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Analyze transcript via SSE ─────────────────────────────────────────────
  const analyze = useCallback(async (chunks: TranscriptChunk[]) => {
    if (chunks.length < 2) return;
    setIsAnalyzing(true);
    setRawStream('');
    setSuggestions(null);

    const text = chunks
      .map(c => `${c.speaker}: ${c.text}`)
      .join('\n');

    try {
      const res = await fetch('/api/google-meet/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const parsed = JSON.parse(payload) as { content?: string; done?: boolean; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.done) break;
            if (parsed.content) {
              accumulated += parsed.content;
              setRawStream(accumulated);
              const parsed2 = tryParseJSON(accumulated);
              if (parsed2) setSuggestions(parsed2);
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }

      const final = tryParseJSON(accumulated);
      if (final) setSuggestions(final);
    } catch (err) {
      console.error('Suggestion error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // ── Add a chunk manually ───────────────────────────────────────────────────
  const addChunk = useCallback((speaker: 'Agent' | 'Customer', text: string) => {
    const chunk: TranscriptChunk = {
      id: ++chunkId.current,
      speaker,
      text: text.trim(),
      timestamp: now(),
    };
    setTranscript(prev => {
      const next = [...prev, chunk];
      // Re-analyze after every agent turn, or every 3 chunks
      if (speaker === 'Agent' || next.length % 3 === 0) analyze(next);
      return next;
    });
  }, [analyze]);

  // ── Demo mode ─────────────────────────────────────────────────────────────
  const runDemoStep = useCallback((index: number) => {
    if (index >= DEMO_TRANSCRIPT.length) {
      setDemoPlaying(false);
      return;
    }
    const item = DEMO_TRANSCRIPT[index];
    addChunk(item.speaker, item.text);
    setDemoIndex(index + 1);
    const delay = item.speaker === 'Customer' ? 3500 : 2200;
    demoRef.current = setTimeout(() => runDemoStep(index + 1), delay);
  }, [addChunk]);

  const startDemo = useCallback(() => {
    if (demoRef.current) clearTimeout(demoRef.current);
    setTranscript([]);
    setSuggestions(null);
    setRawStream('');
    setDemoIndex(0);
    setDemoPlaying(true);
    setConnected(true);
    setElapsed(0);
    demoRef.current = setTimeout(() => runDemoStep(0), 800);
  }, [runDemoStep]);

  const stopDemo = useCallback(() => {
    if (demoRef.current) clearTimeout(demoRef.current);
    setDemoPlaying(false);
  }, []);

  useEffect(() => () => {
    if (demoRef.current) clearTimeout(demoRef.current);
  }, []);

  // ── Submit manual input ────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!connected) setConnected(true);
    addChunk(inputSpeaker, inputText);
    setInputText('');
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* ── Header ── */}
      <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Google Meet icon (coloured dots) */}
            <div className="flex gap-[3px]">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <span className="font-semibold text-sm">Google Meet · AI Co-pilot</span>
          </div>
          {connected && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live · {formatElapsed(elapsed)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {demoPlaying ? (
            <button
              onClick={stopDemo}
              className="text-xs px-3 py-1.5 rounded border border-border text-muted hover:text-white transition-colors"
            >
              Stop Demo
            </button>
          ) : (
            <button
              onClick={startDemo}
              className="text-xs px-3 py-1.5 rounded bg-accent hover:opacity-90 transition-opacity font-medium"
            >
              ▶ Run Demo
            </button>
          )}
          <a href="/" className="text-xs text-muted hover:text-white transition-colors">← CallPilot</a>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Simulated Meet UI + Transcript ── */}
        <div className="flex flex-col w-1/2 border-r border-border overflow-hidden">

          {/* Fake camera feeds */}
          <div className="bg-[#202124] flex gap-2 p-3 border-b border-border">
            <div className="flex-1 rounded-lg bg-[#3c4043] aspect-video flex items-center justify-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">A</div>
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 px-1.5 py-0.5 rounded">Agent (You)</span>
            </div>
            <div className="flex-1 rounded-lg bg-[#3c4043] aspect-video flex items-center justify-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-lg font-bold">C</div>
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 px-1.5 py-0.5 rounded">Customer</span>
            </div>
          </div>

          {/* Live Transcript */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Live Transcript</p>

            {transcript.length === 0 && (
              <div className="text-center text-muted mt-12">
                <p className="text-sm">No transcript yet.</p>
                <p className="text-xs mt-1">Click <strong>Run Demo</strong> or type below to start.</p>
              </div>
            )}

            {transcript.map(chunk => (
              <div key={chunk.id} className={`flex gap-2 ${chunk.speaker === 'Agent' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  chunk.speaker === 'Agent' ? 'bg-blue-600' : 'bg-orange-600'
                }`}>
                  {chunk.speaker[0]}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  chunk.speaker === 'Agent'
                    ? 'bg-blue-600/20 border border-blue-600/30'
                    : 'bg-surface border border-border'
                }`}>
                  <p className="text-[10px] text-muted mb-0.5">{chunk.speaker} · {chunk.timestamp}</p>
                  <p className="text-sm leading-relaxed">{chunk.text}</p>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {/* Manual input */}
          <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2 items-end bg-surface">
            <select
              value={inputSpeaker}
              onChange={e => setInputSpeaker(e.target.value as 'Agent' | 'Customer')}
              className="bg-bg border border-border rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-accent"
            >
              <option value="Customer">Customer</option>
              <option value="Agent">Agent</option>
            </select>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type transcript line..."
              className="flex-1 bg-bg border border-border rounded px-3 py-2 text-sm placeholder-muted focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-accent px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Add
            </button>
          </form>
        </div>

        {/* ── Right: AI Suggestions ── */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">AI Suggestions</h2>
              <p className="text-[11px] text-muted mt-0.5">Updates automatically as conversation unfolds</p>
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Analyzing…
              </div>
            )}
            {suggestions?.urgencyLevel && !isAnalyzing && (
              <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded border ${urgencyColor(suggestions.urgencyLevel)}`}>
                {suggestions.urgencyLevel} urgency
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!suggestions && !isAnalyzing && (
              <div className="text-center text-muted mt-16">
                <p className="text-sm">Waiting for transcript…</p>
                <p className="text-xs mt-1">Suggestions appear automatically after each agent turn.</p>
              </div>
            )}

            {isAnalyzing && !suggestions && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 animate-pulse">
                    <div className="h-2 bg-border rounded w-1/3 mb-2" />
                    <div className="h-3 bg-border rounded w-full mb-1" />
                    <div className="h-3 bg-border rounded w-4/5" />
                  </div>
                ))}
              </div>
            )}

            {suggestions && (
              <div className="space-y-3">
                <SuggestionCard
                  label="Better Response"
                  value={suggestions.responseImprovement}
                  accent="text-blue-300 border-blue-400/30 bg-blue-400/5"
                />
                <SuggestionCard
                  label="Tone & Empathy"
                  value={suggestions.toneAdvice}
                  accent="text-purple-300 border-purple-400/30 bg-purple-400/5"
                />
                <SuggestionCard
                  label="Missing Information"
                  value={suggestions.missingInfo}
                  accent="text-yellow-300 border-yellow-400/30 bg-yellow-400/5"
                />
                <SuggestionCard
                  label="Knowledge Reference"
                  value={suggestions.kbReference}
                  accent="text-green-300 border-green-400/30 bg-green-400/5"
                />
                <SuggestionCard
                  label="Recommended Next Step"
                  value={suggestions.nextAction}
                  accent="text-orange-300 border-orange-400/30 bg-orange-400/5"
                />

                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-xs text-muted pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Updating suggestions…
                  </div>
                )}
              </div>
            )}

            {/* Raw stream debug (collapsed) */}
            {rawStream && !suggestions && (
              <details className="mt-4">
                <summary className="text-[10px] text-muted cursor-pointer">Raw AI output</summary>
                <pre className="text-[10px] text-muted mt-2 whitespace-pre-wrap font-mono bg-surface border border-border rounded p-2 max-h-40 overflow-y-auto">
                  {rawStream}
                </pre>
              </details>
            )}
          </div>

          {/* How it works footer */}
          <div className="border-t border-border p-3 bg-surface">
            <p className="text-[10px] text-muted leading-relaxed">
              <span className="text-white font-medium">How it works:</span> The AI co-pilot monitors the live transcript via Google Meet captions,
              analyzes each turn using NVIDIA Nemotron, and streams improvement suggestions in real-time —
              helping agents respond better, faster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
