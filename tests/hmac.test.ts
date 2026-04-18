import { test } from 'node:test';
import assert from 'node:assert/strict';

import { verifyHmacSha256, signHmacSha256 } from '../lib/hmac';

const SECRET = 'whoops-a-hackathon-secret';
const BODY = JSON.stringify({ call_id: 'abc', transcript: [], duration_s: 30 });

test('verifies its own signature', () => {
  const sig = signHmacSha256(BODY, SECRET);
  assert.equal(verifyHmacSha256(BODY, sig, SECRET), true);
});

test('rejects wrong secret', () => {
  const sig = signHmacSha256(BODY, 'other-secret');
  assert.equal(verifyHmacSha256(BODY, sig, SECRET), false);
});

test('rejects tampered body', () => {
  const sig = signHmacSha256(BODY, SECRET);
  assert.equal(verifyHmacSha256(BODY + ' ', sig, SECRET), false);
});

test('rejects null signature', () => {
  assert.equal(verifyHmacSha256(BODY, null, SECRET), false);
});

test('rejects empty secret', () => {
  const sig = signHmacSha256(BODY, SECRET);
  assert.equal(verifyHmacSha256(BODY, sig, ''), false);
});

test('rejects malformed signature (non-hex)', () => {
  assert.equal(verifyHmacSha256(BODY, 'sha256=not-hex-chars', SECRET), false);
});

test('accepts signatures without the sha256= prefix', () => {
  const sig = signHmacSha256(BODY, SECRET).replace(/^sha256=/, '');
  assert.equal(verifyHmacSha256(BODY, sig, SECRET), true);
});

test('length mismatch returns false without timingSafeEqual throwing', () => {
  // 32 hex chars (short) vs the real 64-char sha256 hex.
  assert.equal(verifyHmacSha256(BODY, 'sha256=' + 'a'.repeat(32), SECRET), false);
});
