import { test } from 'node:test';
import assert from 'node:assert/strict';

import { firstSentences, ragSearch } from '../lib/rag';

test('firstSentences strips H1 and concatenates N sentences', () => {
  const body = '# Title Here\n\nFirst sentence. Second sentence. Third.';
  assert.equal(firstSentences(body, 2), 'First sentence. Second sentence.');
});

test('firstSentences collapses whitespace', () => {
  const body = 'Alpha  is   big.\n\nBeta\tis small.';
  assert.equal(firstSentences(body, 2), 'Alpha is big. Beta is small.');
});

test('firstSentences with count = 1 returns only the first', () => {
  assert.equal(firstSentences('One. Two. Three.', 1), 'One.');
});

test('firstSentences handles text without terminators', () => {
  assert.equal(firstSentences('no punctuation here', 2), 'no punctuation here');
});

test('ragSearch returns [] for empty query without calling embed', async () => {
  // No env side-effect because the early return skips embed entirely.
  const result = await ragSearch('');
  assert.deepEqual(result, []);
  const onlySpace = await ragSearch('   \t\n');
  assert.deepEqual(onlySpace, []);
});
