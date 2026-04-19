import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { useCallStore } from '../lib/store';
import type { Contact, KbArticle, TranscriptChunk } from '../types';

const alice: Contact = {
  id: 'demo-001',
  name: 'Alice',
  phone: '+1',
  tier: 'standard',
  vip: false,
  openTickets: [],
  callHistory: [],
};

const kb1: KbArticle = { id: 'kb1', title: 'one', content: 'one body' };

const chunk: TranscriptChunk = {
  speaker: 'customer',
  text: 'hello',
  timestamp: Date.now(),
};

beforeEach(() => useCallStore.getState().reset());

test('reset returns the store to idle', () => {
  useCallStore.getState().pickPersona(alice);
  useCallStore.getState().reset();
  const s = useCallStore.getState();
  assert.equal(s.status, 'idle');
  assert.equal(s.contact, null);
});

test('pickPersona transitions idle → pre_call with predicted KB', () => {
  useCallStore.getState().pickPersona(alice, [kb1]);
  const s = useCallStore.getState();
  assert.equal(s.status, 'pre_call');
  assert.equal(s.contact?.name, 'Alice');
  assert.equal(s.kbCards.length, 1);
});

test('startCall only transitions from pre_call', () => {
  // from idle — ignored
  useCallStore.getState().startCall('abc');
  assert.equal(useCallStore.getState().status, 'idle');

  useCallStore.getState().pickPersona(alice);
  useCallStore.getState().startCall('xyz');
  assert.equal(useCallStore.getState().status, 'active');
  assert.equal(useCallStore.getState().callId, 'xyz');
});

test('endCall only transitions from active', () => {
  useCallStore.getState().endCall(); // idle → no-op
  assert.equal(useCallStore.getState().status, 'idle');
  useCallStore.getState().pickPersona(alice);
  useCallStore.getState().endCall(); // pre_call → no-op
  assert.equal(useCallStore.getState().status, 'pre_call');
  useCallStore.getState().startCall('x');
  useCallStore.getState().endCall();
  assert.equal(useCallStore.getState().status, 'ended');
});

test('appendTranscript only runs while active', () => {
  useCallStore.getState().appendTranscript(chunk);
  assert.equal(useCallStore.getState().transcript.length, 0);

  useCallStore.getState().pickPersona(alice);
  useCallStore.getState().startCall('x');
  useCallStore.getState().appendTranscript(chunk);
  useCallStore.getState().appendTranscript({ ...chunk, text: 'world' });
  assert.equal(useCallStore.getState().transcript.length, 2);
  assert.equal(useCallStore.getState().transcript[1].text, 'world');
});

test('suggestedReplies caps at 3', () => {
  useCallStore.getState().setSuggestedReplies(['a', 'b', 'c', 'd', 'e']);
  assert.equal(useCallStore.getState().suggestedReplies.length, 3);
  assert.deepEqual(useCallStore.getState().suggestedReplies, ['a', 'b', 'c']);
});

test('escalation toggles via trigger + dismiss', () => {
  useCallStore.getState().triggerEscalation();
  assert.equal(useCallStore.getState().escalationRisk, true);
  useCallStore.getState().dismissEscalation();
  assert.equal(useCallStore.getState().escalationRisk, false);
});

test('pickPersona from ended state starts fresh', () => {
  useCallStore.getState().pickPersona(alice);
  useCallStore.getState().startCall('x');
  useCallStore.getState().appendTranscript(chunk);
  useCallStore.getState().endCall();

  const bob: Contact = { ...alice, id: 'demo-002', name: 'Bob' };
  useCallStore.getState().pickPersona(bob);
  const s = useCallStore.getState();
  assert.equal(s.status, 'pre_call');
  assert.equal(s.contact?.name, 'Bob');
  assert.equal(s.transcript.length, 0); // prior transcript cleared
});
