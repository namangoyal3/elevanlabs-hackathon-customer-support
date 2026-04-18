import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseSummaryResponse,
  parseQaResponse,
  SUMMARY_FALLBACK,
  QA_FALLBACK,
  extractJsonObject,
} from '../lib/summary';
import { QA_CRITERIA, weightedAverage } from '../lib/qa-criteria';

test('extractJsonObject: clean JSON', () => {
  assert.deepEqual(extractJsonObject('{"a":1}'), { a: 1 });
});

test('extractJsonObject: strips markdown fences', () => {
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
});

test('extractJsonObject: null on broken JSON', () => {
  assert.equal(extractJsonObject('{"a":1,'), null);
  assert.equal(extractJsonObject(''), null);
  assert.equal(extractJsonObject(null), null);
});

test('parseSummaryResponse: happy path', () => {
  const raw = `{
    "text": "Customer reported a failed UPI transaction. Agent confirmed T+3 policy.",
    "disposition": "resolved",
    "followUpActions": ["Call back if refund not received"],
    "sentimentTrend": "recovered",
    "csatPrediction": 0.82
  }`;
  const out = parseSummaryResponse(raw);
  assert.equal(out.disposition, 'resolved');
  assert.equal(out.followUpActions.length, 1);
  assert.equal(out.sentimentTrend, 'recovered');
  assert.equal(out.csatPrediction, 0.82);
});

test('parseSummaryResponse: unknown disposition falls back', () => {
  const raw = `{"text":"x","disposition":"pending","followUpActions":[],"sentimentTrend":"neutral","csatPrediction":0.5}`;
  const out = parseSummaryResponse(raw);
  assert.equal(out.disposition, SUMMARY_FALLBACK.disposition);
});

test('parseSummaryResponse: clamps csatPrediction', () => {
  const raw = `{"text":"x","disposition":"resolved","followUpActions":[],"sentimentTrend":"neutral","csatPrediction":5}`;
  assert.equal(parseSummaryResponse(raw).csatPrediction, 1);
});

test('parseSummaryResponse: caps followUpActions at 4', () => {
  const raw = `{"text":"x","disposition":"resolved","followUpActions":["a","b","c","d","e","f"],"sentimentTrend":"neutral","csatPrediction":0.5}`;
  assert.equal(parseSummaryResponse(raw).followUpActions.length, 4);
});

test('parseSummaryResponse: broken JSON returns fallback', () => {
  const out = parseSummaryResponse('not json at all');
  assert.deepEqual(out, SUMMARY_FALLBACK);
});

test('parseSummaryResponse: empty text falls back to "summary unavailable"', () => {
  const raw = `{"text":"","disposition":"resolved","followUpActions":[],"sentimentTrend":"neutral","csatPrediction":0.5}`;
  assert.equal(parseSummaryResponse(raw).text, 'summary unavailable');
});

test('parseQaResponse: happy path', () => {
  const scores: Record<string, { score: number; rationale: string }> = {};
  for (const c of QA_CRITERIA) scores[c.id] = { score: 4, rationale: 'good' };
  const raw = JSON.stringify({ scores, highlights: ['empathetic'], improvements: ['faster wrap-up'] });
  const out = parseQaResponse(raw);
  assert.equal(Object.keys(out.scores).length, QA_CRITERIA.length);
  assert.equal(out.total, 4);
  assert.equal(out.highlights[0], 'empathetic');
});

test('parseQaResponse: out-of-range scores clamp to [1,5]', () => {
  const raw = JSON.stringify({
    scores: { greeting: { score: 99, rationale: 'x' }, accuracy: { score: -3, rationale: 'x' } },
  });
  const out = parseQaResponse(raw);
  assert.equal(out.scores.greeting.score, 5);
  assert.equal(out.scores.accuracy.score, 1);
});

test('parseQaResponse: missing criteria are skipped (not averaged in)', () => {
  const raw = JSON.stringify({ scores: { accuracy: { score: 5, rationale: 'x' } } });
  const out = parseQaResponse(raw);
  assert.equal(out.total, 5); // only observed criterion counts
});

test('parseQaResponse: broken JSON returns fallback', () => {
  assert.deepEqual(parseQaResponse('garbage'), QA_FALLBACK);
});

test('weightedAverage: all 3s gives 3', () => {
  const scores = Object.fromEntries(QA_CRITERIA.map((c) => [c.id, { score: 3, rationale: 'x' }]));
  assert.equal(weightedAverage(scores), 3);
});

test('weightedAverage: weighted by criterion', () => {
  // Give accuracy (weight 0.25) a 5, everything else 1 → total should skew up.
  const scores: Record<string, { score: number; rationale: string }> = {};
  for (const c of QA_CRITERIA) scores[c.id] = { score: c.id === 'accuracy' ? 5 : 1, rationale: 'x' };
  const total = weightedAverage(scores);
  // 5*0.25 + 1*0.75 = 1.25 + 0.75 = 2.0
  assert.equal(total, 2.0);
});

test('weightedAverage: empty scores → 0', () => {
  assert.equal(weightedAverage({}), 0);
});
