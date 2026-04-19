'use client';

import { useEffect, useState } from 'react';
import { useCallStore } from '@/lib/store';
import { DEMO_PERSONAS } from '@/lib/demo-personas';
import type { KbArticle } from '@/types';

/**
 * Dev-only helper for manually exercising every CallState transition without
 * a live ElevenLabs call. Shows up only when the URL has ?demo=1.
 *
 *   Pick persona → Preload KB → Start → Scripted chunks + sentiment → End → Summary
 */
export function DemoCycler() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setEnabled(q.get('demo') === '1');
  }, []);

  if (!enabled) return null;

  const runScenario = async () => {
    const store = useCallStore.getState;
    store().reset();

    const persona = DEMO_PERSONAS[0]; // Priya — failed transaction
    store().pickPersona(persona);

    // pretend to load predicted KB (mock articles; real preload runs in page)
    const mockKb: KbArticle[] = [
      {
        id: 'failed-transaction-policy',
        title: 'Failed Transaction Policy',
        content: '',
        snippet: 'T+3 auto-refund. Track in App → Transactions → Disputes.',
      },
    ];
    store().setKbCards(mockKb);

    store().startCall(`demo-${Date.now()}`);

    store().setIntent('failed_transaction', 0.91);
    store().setSuggestedReplies([
      'Your refund should arrive within 3 business days from the transaction date.',
      'Let me raise a dispute ticket for you.',
      'You can check status in App → Transactions → Disputes.',
    ]);

    const utterances: Array<{ speaker: 'agent' | 'customer'; text: string; sentiment?: number }> = [
      { speaker: 'customer', text: 'Hi, my UPI payment of ₹4,500 failed 3 days ago but the money was debited.', sentiment: 0.1 },
      { speaker: 'agent', text: 'I am sorry to hear that. Can I have your registered number?' },
      { speaker: 'customer', text: "It's 9876543210.", sentiment: 0.0 },
      { speaker: 'customer', text: 'I have been waiting for 4 days. When will I get my refund?', sentiment: -0.3 },
      { speaker: 'customer', text: 'This is absolutely unacceptable. I want to speak to a manager.', sentiment: -0.75 },
    ];

    for (const u of utterances) {
      await wait(900);
      store().appendTranscript({ speaker: u.speaker, text: u.text, timestamp: Date.now() });
      if (u.speaker === 'customer' && typeof u.sentiment === 'number') {
        store().setSentiment(u.sentiment);
        if (u.sentiment < -0.6) store().triggerEscalation();
      }
    }

    await wait(1200);
    store().endCall();

    await wait(1500);
    store().setSummary({
      text: 'Customer reported a failed UPI payment of ₹4,500 debited 3 days ago. Agent confirmed the T+3 auto-refund policy and offered to raise a dispute ticket when the customer expressed frustration. Issue routed to disputes team.',
      disposition: 'escalated',
      followUpActions: [
        'Raise dispute ticket DSP-AUTO',
        'Follow up with customer within 24h',
      ],
      sentimentTrend: 'negative',
      csatPrediction: 0.55,
    });
  };

  return (
    <button
      onClick={runScenario}
      className="fixed bottom-4 right-4 rounded-full border border-yellow-400/60 bg-yellow-400/10 px-4 py-2 text-xs font-mono text-yellow-200 hover:bg-yellow-400/20"
      title="Dev-only: cycles through idle→pre_call→active→ended with scripted data"
    >
      ▶ Cycle demo states
    </button>
  );
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
