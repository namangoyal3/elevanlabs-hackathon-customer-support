import { NextResponse } from 'next/server';
import { z } from 'zod';

import { publish } from '@/lib/sse-bus';
import { TranscriptHandler } from '@/lib/transcript-handler';
import { detectIntent } from '@/lib/intent-parser';
import { ragSearch } from '@/lib/rag';
import type { TranscriptChunk } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * One TranscriptHandler per callId, kept in-memory. Cleared on call end.
 * Keeps rolling-buffer + debounce state per call without pushing it into
 * the client.
 */
const handlers = new Map<string, TranscriptHandler>();
const lastIntentByCall = new Map<string, string>();

const BodySchema = z.object({
  callId: z.string().min(1),
  speaker: z.enum(['agent', 'customer']),
  text: z.string().min(1),
  timestamp: z.number().optional(),
  done: z.boolean().optional(),
});

function getHandler(callId: string): TranscriptHandler {
  const existing = handlers.get(callId);
  if (existing) return existing;

  const handler = new TranscriptHandler(
    undefined,
    async (recent) => {
      const result = await detectIntent(recent);
      if (result.confidence < 0.7) return;

      const last = lastIntentByCall.get(callId);
      publish(callId, {
        type: 'intent',
        label: result.intent,
        confidence: result.confidence,
        query: result.query,
      });

      if (result.intent === last) return;
      lastIntentByCall.set(callId, result.intent);

      if (!result.query) return;

      try {
        const articles = await ragSearch(result.query, 2);
        if (articles.length > 0) {
          publish(callId, { type: 'kb_update', articles });
        }
      } catch (err) {
        console.error('ragSearch failed', { callId, err: (err as Error).message });
      }
    },
    (score) => publish(callId, { type: 'sentiment', score }),
    () => publish(callId, { type: 'escalation' }),
  );
  handlers.set(callId, handler);
  return handler;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad request', detail: parsed.error.format() }, { status: 400 });
  }

  const { callId, speaker, text, timestamp, done } = parsed.data;
  const chunk: TranscriptChunk = { speaker, text, timestamp: timestamp ?? Date.now() };

  publish(callId, { type: 'transcript', chunk });

  const handler = getHandler(callId);
  handler.append(chunk);

  if (done) {
    handler.flushIntent();
    handlers.delete(callId);
    lastIntentByCall.delete(callId);
  }

  return NextResponse.json({ ok: true });
}
