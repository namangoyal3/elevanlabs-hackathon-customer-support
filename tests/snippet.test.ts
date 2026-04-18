import { test } from 'node:test';
import assert from 'node:assert/strict';

import { firstSentences } from '../lib/rag';

test('strips **bold** markdown', () => {
  const out = firstSentences('The **T+3 auto-refund rule** applies here. Second sentence.', 1);
  assert.equal(out, 'The T+3 auto-refund rule applies here.');
});

test('strips *em* markdown but not standalone asterisks in words', () => {
  const out = firstSentences('This is *emphasised*. And a word like *foo* inside.', 2);
  assert.equal(out, 'This is emphasised. And a word like foo inside.');
});

test('strips inline `code`', () => {
  const out = firstSentences('Use the `embedQuery()` helper. Nothing more.', 1);
  assert.equal(out, 'Use the embedQuery() helper.');
});

test('strips [text](url) links to plain text', () => {
  const out = firstSentences('See the [policy page](https://example.com) for details.', 1);
  assert.equal(out, 'See the policy page for details.');
});

test('strips fenced code blocks', () => {
  const body = `First sentence.
\`\`\`ts
const x = 1;
\`\`\`
Second sentence.`;
  const out = firstSentences(body, 2);
  assert.ok(!out.includes('const x'));
  assert.ok(out.includes('First sentence.'));
});

test('preserves arrows and punctuation', () => {
  const out = firstSentences('Track refund at App → Transactions → Disputes. End.', 1);
  assert.equal(out, 'Track refund at App → Transactions → Disputes.');
});
