'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';

import { useCallStore } from '@/lib/store';
import type { DemoPersona } from '@/lib/demo-personas';

type Role = 'agent' | 'customer';

/** Map ElevenLabs conversation event source → our transcript speaker label.
 *  The ElevenLabs "agent" is the AI co-pilot (hearing the call). In our
 *  data model:
 *    user   → the HUMAN agent on the phone  (speaker: 'agent' in store)
 *    ai     → the CUSTOMER-side AI agent    (speaker: 'customer')
 *  Adjust if we hook it up differently in ElevenLabs.
 */
function mapSource(source: unknown): Role | null {
  if (source === 'user' || source === 'agent') return 'agent';
  if (source === 'ai' || source === 'customer') return 'customer';
  return null;
}

export interface UseCallPilotResult {
  status: 'idle' | 'connecting' | 'connected' | 'ended' | 'error';
  error: string | null;
  start: (persona: DemoPersona) => Promise<void>;
  stop: () => Promise<void>;
}

export function useCallPilot(): UseCallPilotResult {
  const [status, setStatus] = useState<UseCallPilotResult['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const callIdRef = useRef<string | null>(null);

  const appendTranscript = useCallStore((s) => s.appendTranscript);
  const startCallStore = useCallStore((s) => s.startCall);
  const endCallStore = useCallStore((s) => s.endCall);

  const conversation = useConversation({
    onConnect: () => {
      setStatus('connected');
      setError(null);
    },
    onDisconnect: () => {
      setStatus('ended');
      endCallStore();
      void postDone(callIdRef.current);
    },
    onError: (e: unknown) => {
      setStatus('error');
      setError(typeof e === 'string' ? e : (e as Error)?.message ?? 'Unknown ElevenLabs error');
    },
    onMessage: (message: unknown) => {
      const { speaker, text } = extractMessage(message);
      if (!speaker || !text) return;
      const callId = callIdRef.current;
      if (!callId) return;
      appendTranscript({ speaker, text, timestamp: Date.now() });
      void postTranscript(callId, speaker, text);
    },
  });

  const start = useCallback(
    async (persona: DemoPersona) => {
      const agentId = process.env.NEXT_PUBLIC_EL_AGENT_ID;
      if (!agentId) {
        setStatus('error');
        setError('NEXT_PUBLIC_EL_AGENT_ID is not set');
        return;
      }

      const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      callIdRef.current = callId;
      startCallStore(callId);
      setStatus('connecting');
      setError(null);

      try {
        await conversation.startSession({
          agentId,
          connectionType: 'webrtc',
          dynamicVariables: {
            caller_name: persona.name,
            account_tier: persona.tier,
            open_tickets: JSON.stringify(persona.openTickets),
          },
        });
      } catch (e) {
        setStatus('error');
        setError((e as Error).message);
      }
    },
    [conversation, startCallStore],
  );

  const stop = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // Fine: already ended.
    }
    void postDone(callIdRef.current);
    callIdRef.current = null;
  }, [conversation]);

  // Cleanup on unmount.
  useEffect(() => () => void conversation.endSession().catch(() => {}), [conversation]);

  return { status, error, start, stop };
}

function extractMessage(message: unknown): { speaker: Role | null; text: string } {
  if (!message || typeof message !== 'object') return { speaker: null, text: '' };
  const m = message as Record<string, unknown>;
  const speaker = mapSource(m.source);
  const text = typeof m.message === 'string' ? m.message : typeof m.text === 'string' ? m.text : '';
  return { speaker, text: text.trim() };
}

async function postTranscript(callId: string, speaker: Role, text: string): Promise<void> {
  try {
    await fetch('/api/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, speaker, text, timestamp: Date.now() }),
    });
  } catch {
    // Silent: the UI already has the chunk via appendTranscript. Server-side
    // analysis is a secondary path; a missed POST just means no intent/KB
    // update for that utterance.
  }
}

async function postDone(callId: string | null): Promise<void> {
  if (!callId) return;
  try {
    await fetch('/api/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, speaker: 'agent', text: '[call ended]', done: true }),
    });
  } catch {}
}
