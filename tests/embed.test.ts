import { test } from 'node:test';
import assert from 'node:assert/strict';

import { embedPassage, embedQuery, NVIDIA_EMBED_DIM } from '../lib/nvidia-embed';

type FetchArgs = Parameters<typeof fetch>;

function stubFetch(responder: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: FetchArgs[0], init?: FetchArgs[1]) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const initObj = (init ?? {}) as RequestInit;
    calls.push({ url, init: initObj });
    return responder(url, initObj);
  }) as typeof fetch;
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

test('embedPassage hits nvidia endpoint with input_type=passage', async () => {
  process.env.NVIDIA_API_KEY = 'test-key';
  const vec = Array(NVIDIA_EMBED_DIM).fill(0.1);
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ data: [{ embedding: vec }] }), { status: 200 }),
  );
  try {
    const out = await embedPassage('some passage');
    assert.equal(out.length, NVIDIA_EMBED_DIM);
    assert.equal(stub.calls.length, 1);
    assert.match(stub.calls[0].url, /integrate\.api\.nvidia\.com\/v1\/embeddings/);
    const body = JSON.parse(stub.calls[0].init.body as string);
    assert.equal(body.input_type, 'passage');
    assert.equal(body.model, 'nvidia/nv-embedqa-e5-v5');
  } finally {
    stub.restore();
  }
});

test('embedQuery uses input_type=query', async () => {
  process.env.NVIDIA_API_KEY = 'test-key';
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ data: [{ embedding: Array(NVIDIA_EMBED_DIM).fill(0) }] }), { status: 200 }),
  );
  try {
    await embedQuery('what is it');
    const body = JSON.parse(stub.calls[0].init.body as string);
    assert.equal(body.input_type, 'query');
  } finally {
    stub.restore();
  }
});

test('embed throws when dim mismatches expected', async () => {
  process.env.NVIDIA_API_KEY = 'test-key';
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2, 0.3] }] }), { status: 200 }),
  );
  try {
    await assert.rejects(() => embedPassage('x'), /unexpected response shape/);
  } finally {
    stub.restore();
  }
});

test('embed throws on non-200', async () => {
  process.env.NVIDIA_API_KEY = 'test-key';
  const stub = stubFetch(() => new Response('boom', { status: 500 }));
  try {
    await assert.rejects(() => embedPassage('x'), /NVIDIA embed 500/);
  } finally {
    stub.restore();
  }
});

test('embed throws when NVIDIA_API_KEY missing', async () => {
  const saved = process.env.NVIDIA_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  try {
    await assert.rejects(() => embedPassage('x'), /NVIDIA_API_KEY is not set/);
  } finally {
    if (saved) process.env.NVIDIA_API_KEY = saved;
  }
});
