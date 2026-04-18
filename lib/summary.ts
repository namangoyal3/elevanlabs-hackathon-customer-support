import type { CallSummary, Disposition, SentimentTrend, TranscriptChunk } from '@/types';
import { DEEP_MODEL, nvidiaClient } from '@/lib/nvidia-llm';
import {
  QA_CRITERIA,
  type QaResult,
  type QaScoreMap,
  weightedAverage,
} from '@/lib/qa-criteria';

const DISPOSITIONS: readonly Disposition[] = ['resolved', 'follow_up', 'escalated', 'abandoned'];
const TRENDS: readonly SentimentTrend[] = ['positive', 'neutral', 'negative', 'recovered'];

export const SUMMARY_FALLBACK: CallSummary = {
  text: 'summary unavailable',
  disposition: 'follow_up',
  followUpActions: [],
  sentimentTrend: 'neutral',
  csatPrediction: 0.5,
};

export const QA_FALLBACK: QaResult = {
  scores: {},
  total: 0,
  highlights: [],
  improvements: [],
};

const SUMMARY_SYSTEM = `You are a post-call summarisation engine for NovaPay, an Indian fintech's customer-support operation.
Analyse the provided call transcript and respond ONLY with a single valid JSON object. No preamble, no markdown fences.

Schema:
{
  "text": 3 concise sentences covering: the issue, what the agent did, the outcome,
  "disposition": one of ${JSON.stringify(DISPOSITIONS)},
  "followUpActions": array of short action strings (0-4 items),
  "sentimentTrend": one of ${JSON.stringify(TRENDS)},
  "csatPrediction": float 0.0 to 1.0
}`;

const QA_SYSTEM = `You are a QA analyst for a fintech customer-support team. Evaluate the given call transcript across a fixed rubric.
Respond ONLY with a single valid JSON object. No preamble, no markdown fences.

Schema:
{
  "scores": { "<criterion_id>": { "score": integer 1-5, "rationale": short sentence } },
  "highlights": array of short positive observations (0-3 items),
  "improvements": array of short coaching suggestions (0-3 items)
}

You must score every criterion_id listed in the rubric below, even if the transcript doesn't cover the topic (in that case, score 3 with a rationale that says "not observed").`;

/**
 * Extract the first balanced {…} JSON object from arbitrary text.
 * Same tolerance rules as lib/intent-parser.ts — don't trust the model to
 * only emit JSON.
 */
export function extractJsonObject(raw: string | null | undefined): unknown {
  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export function parseSummaryResponse(raw: string | null | undefined): CallSummary {
  const obj = extractJsonObject(raw);
  if (!obj || typeof obj !== 'object') return SUMMARY_FALLBACK;
  const o = obj as Record<string, unknown>;

  const text = typeof o.text === 'string' && o.text.trim() ? o.text.trim() : SUMMARY_FALLBACK.text;
  const disposition = DISPOSITIONS.includes(o.disposition as Disposition)
    ? (o.disposition as Disposition)
    : SUMMARY_FALLBACK.disposition;

  const followUpActions = Array.isArray(o.followUpActions)
    ? o.followUpActions.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 4)
    : [];

  const sentimentTrend = TRENDS.includes(o.sentimentTrend as SentimentTrend)
    ? (o.sentimentTrend as SentimentTrend)
    : SUMMARY_FALLBACK.sentimentTrend;

  const rawCsat = typeof o.csatPrediction === 'number' ? o.csatPrediction : Number(o.csatPrediction);
  const csatPrediction = Number.isFinite(rawCsat) ? Math.max(0, Math.min(1, rawCsat)) : SUMMARY_FALLBACK.csatPrediction;

  return { text, disposition, followUpActions, sentimentTrend, csatPrediction };
}

export function parseQaResponse(raw: string | null | undefined): QaResult {
  const obj = extractJsonObject(raw);
  if (!obj || typeof obj !== 'object') return QA_FALLBACK;
  const o = obj as Record<string, unknown>;

  const scoresInput = (typeof o.scores === 'object' && o.scores !== null ? o.scores : {}) as Record<string, unknown>;
  const scores: QaScoreMap = {};
  for (const c of QA_CRITERIA) {
    const entry = scoresInput[c.id];
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const rawScore = typeof e.score === 'number' ? e.score : Number(e.score);
    if (!Number.isFinite(rawScore)) continue;
    const score = Math.max(1, Math.min(5, Math.round(rawScore)));
    const rationale = typeof e.rationale === 'string' ? e.rationale.trim() : '';
    scores[c.id] = { score, rationale };
  }

  const highlights = Array.isArray(o.highlights)
    ? o.highlights.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 3)
    : [];
  const improvements = Array.isArray(o.improvements)
    ? o.improvements.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 3)
    : [];

  return {
    scores,
    total: weightedAverage(scores),
    highlights,
    improvements,
  };
}

function transcriptText(transcript: TranscriptChunk[]): string {
  return transcript.map((c) => `[${c.speaker.toUpperCase()}] ${c.text}`).join('\n');
}

export async function summarizeCall(transcript: TranscriptChunk[]): Promise<CallSummary> {
  if (transcript.length === 0) return SUMMARY_FALLBACK;
  try {
    const res = await nvidiaClient().chat.completions.create({
      model: DEEP_MODEL,
      max_tokens: 512,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM },
        { role: 'user', content: transcriptText(transcript) },
      ],
    });
    return parseSummaryResponse(res.choices[0]?.message?.content);
  } catch (err) {
    console.error('summarizeCall failed', (err as Error).message);
    return SUMMARY_FALLBACK;
  }
}

export async function scoreQA(transcript: TranscriptChunk[]): Promise<QaResult> {
  if (transcript.length === 0) return QA_FALLBACK;
  const prompt = `Rubric:\n${JSON.stringify(QA_CRITERIA)}\n\nTranscript:\n${transcriptText(transcript)}`;
  try {
    const res = await nvidiaClient().chat.completions.create({
      model: DEEP_MODEL,
      max_tokens: 1024,
      temperature: 0.2,
      messages: [
        { role: 'system', content: QA_SYSTEM },
        { role: 'user', content: prompt },
      ],
    });
    return parseQaResponse(res.choices[0]?.message?.content);
  } catch (err) {
    console.error('scoreQA failed', (err as Error).message);
    return QA_FALLBACK;
  }
}
