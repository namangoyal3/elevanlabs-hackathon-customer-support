import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseIntentResponse } from '../lib/intent-parser';

test('parses clean JSON', () => {
  const out = parseIntentResponse(
    '{"intent":"failed_transaction","confidence":0.91,"query":"UPI payment failed refund"}',
  );
  assert.equal(out.intent, 'failed_transaction');
  assert.equal(out.confidence, 0.91);
  assert.equal(out.query, 'UPI payment failed refund');
});

test('strips markdown fences', () => {
  const out = parseIntentResponse(
    '```json\n{"intent":"kyc_issue","confidence":0.8,"query":"kyc docs"}\n```',
  );
  assert.equal(out.intent, 'kyc_issue');
  assert.equal(out.confidence, 0.8);
});

test('extracts JSON from prose wrapper', () => {
  const out = parseIntentResponse(
    'Sure, here you go: {"intent":"loan_status","confidence":0.77,"query":"loan disbursal"} hope that helps',
  );
  assert.equal(out.intent, 'loan_status');
});

test('falls back to other/0 on null/empty/nonsense', () => {
  for (const input of [null, undefined, '', '  ', 'hello world', 'not json at all']) {
    const out = parseIntentResponse(input);
    assert.equal(out.intent, 'other');
    assert.equal(out.confidence, 0);
  }
});

test('unknown intent labels collapse to other', () => {
  const out = parseIntentResponse('{"intent":"haberdashery","confidence":0.9,"query":"?"}');
  assert.equal(out.intent, 'other');
});

test('confidence clamps into [0, 1]', () => {
  const high = parseIntentResponse('{"intent":"rewards","confidence":5.5,"query":"q"}');
  assert.equal(high.confidence, 1);
  const neg = parseIntentResponse('{"intent":"rewards","confidence":-2,"query":"q"}');
  assert.equal(neg.confidence, 0);
});

test('non-numeric confidence becomes 0 (intent label preserved)', () => {
  const out = parseIntentResponse('{"intent":"privacy","confidence":"very high","query":"q"}');
  assert.equal(out.confidence, 0);
  assert.equal(out.intent, 'privacy');
  // Downstream callers enforce their own confidence gates (e.g. >= 0.7) so
  // confidence=0 is effectively a "no change" signal without losing the label.
});

test('missing query becomes empty string', () => {
  const out = parseIntentResponse('{"intent":"wallet_topup","confidence":0.9}');
  assert.equal(out.query, '');
  assert.equal(out.intent, 'wallet_topup');
});

test('broken JSON falls back', () => {
  const out = parseIntentResponse('{"intent":"foo", "confidence": 0.5,');
  assert.equal(out.intent, 'other');
});

test('other+0 from the model itself is treated as no-change signal', () => {
  const out = parseIntentResponse('{"intent":"other","confidence":0,"query":""}');
  assert.equal(out.intent, 'other');
  assert.equal(out.confidence, 0);
});
