import type { TranscriptChunk } from '@/types';
import { INTENT_MODEL, nvidiaClient } from '@/lib/nvidia-llm';

export const INTENT_LABELS = [
  'failed_transaction',
  'kyc_issue',
  'loan_status',
  'wallet_topup',
  'chargeback',
  'account_freeze',
  'rewards',
  'privacy',
  'other',
] as const;

export type IntentLabel = (typeof INTENT_LABELS)[number];

export interface IntentResult {
  intent: IntentLabel;
  confidence: number; // 0..1
  query: string; // RAG-ready query string
}

const FALLBACK: IntentResult = { intent: 'other', confidence: 0, query: '' };

const SYSTEM_PROMPT = `You are an intent classifier for NovaPay, an Indian fintech's customer-support system.
Given the most recent utterances from a live call, identify what the customer needs.

Respond ONLY with a single valid JSON object. No preamble, no markdown fences, no explanation.

Schema:
{
  "intent": one of ${JSON.stringify(INTENT_LABELS)},
  "confidence": float 0.0 to 1.0,
  "query": a concise phrase suitable for a knowledge-base search (e.g. "UPI payment failed refund")
}

If you are uncertain or the conversation hasn't surfaced a clear intent, return:
{"intent":"other","confidence":0,"query":""}`;

/**
 * Parses any string the LLM returns and extracts a valid IntentResult.
 * Tolerant to: stray prose, leading/trailing whitespace, markdown code fences,
 * missing fields, wrong types, unknown labels.
 *
 * Returns FALLBACK on anything it can't salvage — callers can compare against
 * `FALLBACK.intent === 'other' && confidence === 0` to treat it as "no change".
 */
export function parseIntentResponse(raw: string | null | undefined): IntentResult {
  if (!raw) return FALLBACK;

  // Strip markdown fences if the model wrapped in ```json ... ```
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Find the first {...} object if there's wrapping prose.
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return FALLBACK;

  let obj: unknown;
  try {
    obj = JSON.parse(jsonMatch[0]);
  } catch {
    return FALLBACK;
  }

  if (!obj || typeof obj !== 'object') return FALLBACK;
  const o = obj as Record<string, unknown>;

  const intent = INTENT_LABELS.includes(o.intent as IntentLabel)
    ? (o.intent as IntentLabel)
    : 'other';

  const rawConf = typeof o.confidence === 'number' ? o.confidence : Number(o.confidence);
  const confidence = Number.isFinite(rawConf) ? Math.max(0, Math.min(1, rawConf)) : 0;

  const query = typeof o.query === 'string' ? o.query.trim() : '';

  if (intent === 'other' && confidence === 0) return FALLBACK;
  return { intent, confidence, query };
}

export async function detectIntent(transcript: TranscriptChunk[]): Promise<IntentResult> {
  if (transcript.length === 0) return FALLBACK;

  const recent = transcript
    .slice(-5)
    .map((c) => `${c.speaker.toUpperCase()}: ${c.text}`)
    .join('\n');

  try {
    const response = await nvidiaClient().chat.completions.create({
      model: INTENT_MODEL,
      max_tokens: 128,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: recent },
      ],
    });
    return parseIntentResponse(response.choices[0]?.message?.content);
  } catch {
    return FALLBACK;
  }
}
