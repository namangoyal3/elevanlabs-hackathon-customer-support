/**
 * Server-Sent Events pub/sub, keyed by callId.
 *
 *   publishers (api/transcript, api/webhooks/call/end)
 *              │
 *              ▼ publish(callId, event)
 *   ┌──────────────────────┐
 *   │  Map<callId,         │
 *   │      Set<Subscriber>>│
 *   └──────────────────────┘
 *              │ fan-out
 *              ▼
 *   subscribers (api/stream — one per browser tab)
 *
 * In-memory only. Fine for a single-process hackathon demo; for real
 * prod this belongs in Redis pub/sub or similar.
 */

export type SseEvent =
  | { type: 'transcript'; chunk: { speaker: 'agent' | 'customer'; text: string; timestamp: number } }
  | { type: 'intent'; label: string; confidence: number; query: string }
  | { type: 'kb_update'; articles: unknown[] }
  | { type: 'sentiment'; score: number }
  | { type: 'escalation' }
  | { type: 'suggested_replies'; replies: string[] }
  | { type: 'post_call_summary'; summary: unknown; qaScore?: unknown };

interface Subscriber {
  send: (event: SseEvent) => void;
  close: () => void;
}

const channels = new Map<string, Set<Subscriber>>();

export function subscribe(callId: string, sub: Subscriber): () => void {
  let set = channels.get(callId);
  if (!set) {
    set = new Set();
    channels.set(callId, set);
  }
  set.add(sub);
  return () => {
    const s = channels.get(callId);
    if (!s) return;
    s.delete(sub);
    if (s.size === 0) channels.delete(callId);
  };
}

export function publish(callId: string, event: SseEvent): void {
  const set = channels.get(callId);
  if (!set) return;
  for (const sub of set) {
    try {
      sub.send(event);
    } catch {
      // drop silently — the subscriber's own close handler will clean up
    }
  }
}

export function subscriberCount(callId: string): number {
  return channels.get(callId)?.size ?? 0;
}
