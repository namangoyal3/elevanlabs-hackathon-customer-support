import { NextResponse } from 'next/server';
import { verifyHmacSha256 } from '@/lib/hmac';
import { supabaseAdmin } from '@/lib/db';
import { runPostCallPipeline } from '@/lib/post-call';
import type { TranscriptChunk } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface WebhookBody {
  call_id?: string;
  callId?: string;
  transcript?: Array<{ speaker?: string; text?: string; timestamp?: number | string }>;
  duration_s?: number;
  metadata?: {
    agent_id?: string;
    contact_id?: string;
  };
}

function normalizeTranscript(raw: WebhookBody['transcript']): TranscriptChunk[] {
  if (!Array.isArray(raw)) return [];
  const out: TranscriptChunk[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const speaker = row.speaker === 'customer' ? 'customer' : row.speaker === 'agent' ? 'agent' : null;
    if (!speaker) continue;
    const text = typeof row.text === 'string' ? row.text.trim() : '';
    if (!text) continue;
    const ts = typeof row.timestamp === 'number' ? row.timestamp : Number(row.timestamp) || Date.now();
    out.push({ speaker, text, timestamp: ts });
  }
  return out;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  const signature = req.headers.get('x-elevenlabs-signature') ?? req.headers.get('elevenlabs-signature');

  // In dev, allow bypass ONLY if the secret is completely unset. Production
  // configures the secret so this branch never runs.
  if (secret) {
    if (!verifyHmacSha256(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const callId = body.call_id ?? body.callId;
  if (!callId || typeof callId !== 'string') {
    return NextResponse.json({ error: 'call_id required' }, { status: 400 });
  }

  // Idempotency: mark processed up front. Any later duplicate exits at this
  // check with a 200, preventing double-pipeline.
  try {
    const client = supabaseAdmin();
    const { data: existing } = await client
      .from('calls')
      .select('id, processed')
      .eq('id', callId)
      .maybeSingle();

    if (existing?.processed) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await client.from('calls').upsert(
      {
        id: callId,
        processed: true,
        ended_at: new Date().toISOString(),
        duration_s: body.duration_s ?? null,
        agent_id: body.metadata?.agent_id ?? null,
        contact_id: body.metadata?.contact_id ?? null,
      },
      { onConflict: 'id' },
    );
  } catch (err) {
    console.error('webhook idempotency upsert failed', { callId, err: (err as Error).message });
    // Still proceed — better to run the pipeline than drop the webhook.
  }

  const transcript = normalizeTranscript(body.transcript);

  // Fire-and-forget. The webhook must return <5s; the pipeline takes longer.
  setImmediate(() => {
    runPostCallPipeline(callId, transcript, {
      agentId: body.metadata?.agent_id,
      contactId: body.metadata?.contact_id,
      durationSeconds: body.duration_s,
    }).catch((err) =>
      console.error('post_call_pipeline_failed', { callId, err: (err as Error).message }),
    );
  });

  return NextResponse.json({ ok: true });
}
