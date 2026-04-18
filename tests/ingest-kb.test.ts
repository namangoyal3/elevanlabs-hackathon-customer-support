import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseArticle } from '../scripts/ingest-kb';

test('parseArticle extracts title from H1 and derives id from filename', () => {
  const body = '# Failed Transaction Policy\n\nIf a UPI payment fails...';
  const parsed = parseArticle('failed-transaction-policy.md', body);
  assert.equal(parsed.id, 'failed-transaction-policy');
  assert.equal(parsed.title, 'Failed Transaction Policy');
  assert.equal(parsed.content, body);
});

test('parseArticle falls back to filename when no H1', () => {
  const body = 'Just some content, no heading.';
  const parsed = parseArticle('orphan.md', body);
  assert.equal(parsed.id, 'orphan');
  assert.equal(parsed.title, 'Just some content, no heading.');
});

test('parseArticle handles extra whitespace in H1', () => {
  const parsed = parseArticle('x.md', '#   Spaced Title   \nbody');
  assert.equal(parsed.title, 'Spaced Title');
});
