import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TranscriptHandler,
  DEFAULT_CONFIG,
  scoreSentiment,
} from '../lib/transcript-handler';
import type { TranscriptChunk } from '../types';

function chunk(speaker: 'agent' | 'customer', text: string, offset = 0): TranscriptChunk {
  return { speaker, text, timestamp: Date.now() + offset };
}

test('buffer caps at configured size', () => {
  const seen: TranscriptChunk[][] = [];
  const h = new TranscriptHandler(
    { ...DEFAULT_CONFIG, bufferSize: 3, debounceMs: 0 },
    (r) => {
      seen.push(r);
    },
  );
  for (let i = 0; i < 5; i++) h.append(chunk('customer', `msg ${i}`, i));
  // wait a tick for the debounce-0 microtask
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      assert.equal(h.snapshot().length, 3);
      assert.equal(h.snapshot()[0].text, 'msg 2'); // oldest dropped
      resolve();
    }, 10),
  );
});

test('intent debounce coalesces rapid appends', () => {
  const calls: number[] = [];
  const h = new TranscriptHandler(
    { ...DEFAULT_CONFIG, debounceMs: 30 },
    () => {
      calls.push(Date.now());
    },
  );
  h.append(chunk('customer', 'a'));
  h.append(chunk('customer', 'b'));
  h.append(chunk('customer', 'c'));
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      assert.equal(calls.length, 1, 'debounce should fire once, not three times');
      resolve();
    }, 80),
  );
});

test('flushIntent runs pending intent check immediately', () => {
  let fired = false;
  const h = new TranscriptHandler(
    { ...DEFAULT_CONFIG, debounceMs: 10_000 },
    () => {
      fired = true;
    },
  );
  h.append(chunk('customer', 'hello'));
  assert.equal(fired, false);
  h.flushIntent();
  assert.equal(fired, true);
});

test('agent utterances do not trigger sentiment callback', () => {
  let sentimentCalls = 0;
  const h = new TranscriptHandler(
    DEFAULT_CONFIG,
    () => {},
    () => {
      sentimentCalls++;
    },
  );
  h.append(chunk('agent', 'Hi, how can I help?'));
  assert.equal(sentimentCalls, 0);
});

test('sentiment threshold triggers escalation only below -0.6', () => {
  const escalations: number[] = [];
  const h = new TranscriptHandler(
    { ...DEFAULT_CONFIG, debounceMs: 10_000 },
    () => {},
    () => {},
    (score) => {
      escalations.push(score);
    },
  );
  h.append(chunk('customer', 'this is annoying but ok')); // moderate negative
  h.append(chunk('customer', 'this is absolutely unacceptable! I want a manager!')); // strong negative
  assert.equal(escalations.length, 1);
  assert.ok(escalations[0] < -0.6);
});

test('escalation cooldown suppresses duplicate alerts', () => {
  const escalations: number[] = [];
  const h = new TranscriptHandler(
    { ...DEFAULT_CONFIG, debounceMs: 10_000, sentimentCooldownMs: 10_000 },
    () => {},
    () => {},
    () => {
      escalations.push(1);
    },
  );
  h.append(chunk('customer', 'this is absolutely unacceptable unacceptable!'));
  h.append(chunk('customer', 'this is ridiculous and a scam!'));
  assert.equal(escalations.length, 1, 'cooldown should suppress second alert');
});

test('scoreSentiment: positive words raise score', () => {
  assert.ok(scoreSentiment('thanks so much, this is great') > 0.3);
});

test('scoreSentiment: hostile words crash score', () => {
  assert.ok(scoreSentiment('this is absolutely unacceptable') < -0.6);
  assert.ok(scoreSentiment('I want a manager this is a scam') < -0.6);
});

test('scoreSentiment: clamps to [-1, 1]', () => {
  const veryHostile = 'unacceptable unacceptable ridiculous scam fraud cheat';
  const s = scoreSentiment(veryHostile);
  assert.ok(s >= -1 && s <= 1);
});

test('scoreSentiment: empty string is 0', () => {
  assert.equal(scoreSentiment(''), 0);
  assert.equal(scoreSentiment('   '), 0);
});
