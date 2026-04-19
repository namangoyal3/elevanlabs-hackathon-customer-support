import type { TranscriptChunk } from '@/types';

/**
 * Pure server-side state machine for a single call's transcript stream.
 *
 *   ┌─ appendChunk ─▶ rolling buffer (max 10 utterances)
 *   │
 *   ├─ every append   → scheduleIntentCheck (debounce 2000ms, coalesces bursts)
 *   └─ customer utt   → scoreSentiment (naive keyword model, no network)
 *                         └─ if score < -0.6 → emit escalation
 *
 *  One handler per call. State is held per callId in a Map in the
 *  route; don't move it to module scope — tests + SSR need fresh per-call
 *  instances.
 */

export interface HandlerConfig {
  bufferSize: number;
  debounceMs: number;
  escalationThreshold: number;
  sentimentCooldownMs: number;
}

export const DEFAULT_CONFIG: HandlerConfig = {
  bufferSize: 10,
  debounceMs: 2000,
  escalationThreshold: -0.6,
  sentimentCooldownMs: 10_000,
};

export interface IntentCallback {
  (recent: TranscriptChunk[]): void | Promise<void>;
}
export interface SentimentCallback {
  (score: number, chunk: TranscriptChunk): void | Promise<void>;
}
export interface EscalationCallback {
  (score: number, chunk: TranscriptChunk): void | Promise<void>;
}

export class TranscriptHandler {
  private buffer: TranscriptChunk[] = [];
  private intentTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEscalationAt = 0;

  constructor(
    private readonly cfg: HandlerConfig = DEFAULT_CONFIG,
    private readonly onIntent: IntentCallback = () => {},
    private readonly onSentiment: SentimentCallback = () => {},
    private readonly onEscalation: EscalationCallback = () => {},
  ) {}

  append(chunk: TranscriptChunk): void {
    this.buffer.push(chunk);
    if (this.buffer.length > this.cfg.bufferSize) this.buffer.shift();

    // Debounced intent check — coalesces rapid bursts into a single LLM call.
    if (this.intentTimer) clearTimeout(this.intentTimer);
    const snapshot = this.buffer.slice();
    this.intentTimer = setTimeout(() => {
      this.intentTimer = null;
      void this.onIntent(snapshot);
    }, this.cfg.debounceMs);

    if (chunk.speaker === 'customer') {
      const score = scoreSentiment(chunk.text);
      void this.onSentiment(score, chunk);
      if (score < this.cfg.escalationThreshold) {
        const now = Date.now();
        if (now - this.lastEscalationAt >= this.cfg.sentimentCooldownMs) {
          this.lastEscalationAt = now;
          void this.onEscalation(score, chunk);
        }
      }
    }
  }

  /** Flush pending intent check immediately — call on call-end so final buffer
   *  state gets surfaced before the handler is dropped. */
  flushIntent(): void {
    if (this.intentTimer) {
      clearTimeout(this.intentTimer);
      this.intentTimer = null;
      void this.onIntent(this.buffer.slice());
    }
  }

  snapshot(): TranscriptChunk[] {
    return this.buffer.slice();
  }
}

/**
 * Keyword-based sentiment scorer. Deliberately naive and synchronous — we
 * don't want an LLM call on every customer utterance, and the threshold we
 * care about is coarse-grained ("hostile / not hostile"), not fine-grained.
 *
 * Returns a float in [-1, 1]. Positive = polite, negative = frustrated,
 * strongly negative = hostile.
 */
export function scoreSentiment(text: string): number {
  const normalized = text.toLowerCase();
  const tokens = normalized.match(/\b[a-z']+\b/g) ?? [];
  if (tokens.length === 0) return 0;

  let score = 0;
  for (const t of tokens) {
    if (POSITIVE.has(t)) score += 0.35;
    if (NEGATIVE.has(t)) score -= 0.35;
    if (HOSTILE.has(t)) score -= 0.85;
  }

  // Exclamation count amplifies whichever direction is dominant.
  const bangs = (text.match(/!/g) ?? []).length;
  if (bangs > 0 && score !== 0) score += Math.sign(score) * Math.min(0.3, bangs * 0.1);

  return Math.max(-1, Math.min(1, score));
}

const POSITIVE = new Set([
  'thanks', 'thank', 'thankyou', 'appreciate', 'great', 'good', 'perfect',
  'helpful', 'please', 'hi', 'hello', 'ok', 'okay', 'resolved', 'fixed',
]);

const NEGATIVE = new Set([
  'frustrated', 'annoying', 'annoyed', 'wait', 'waiting', 'slow', 'late',
  'delay', 'delayed', 'still', 'again', 'already', 'problem', 'issue',
  'broken', 'failed', 'fail', 'wrong', 'missing', 'bad', 'worse',
]);

const HOSTILE = new Set([
  'unacceptable', 'ridiculous', 'useless', 'terrible', 'awful', 'manager',
  'supervisor', 'lawsuit', 'sue', 'complain', 'scam', 'fraud', 'cheat',
  'cheated', 'refund', 'cancel', 'close',
]);
