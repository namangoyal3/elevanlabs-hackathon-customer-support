import type { TranscriptChunk } from '@/types';
import { summarizeCall, scoreQA } from '@/lib/summary';
import { supabaseAdmin } from '@/lib/db';
import { publish } from '@/lib/sse-bus';

export interface PostCallMeta {
  agentId?: string;
  contactId?: string;
  durationSeconds?: number;
}

/**
 *  runPostCallPipeline — fire-and-forget chain that runs after the webhook
 *  has already replied 200. Summary + QA are independent calls so they run
 *  in parallel.
 *
 *    ┌────────────────────────────────────┐
 *    │ transcript → summarizeCall ─┐      │
 *    │                             ├─→ DB │
 *    │             → scoreQA ──────┘      │
 *    │                                    │
 *    └─────→ publish SSE post_call_summary│
 *
 *  Errors are caught at each stage so a failing QA score doesn't poison
 *  the summary persistence, and vice versa.
 */
export async function runPostCallPipeline(
  callId: string,
  transcript: TranscriptChunk[],
  meta: PostCallMeta,
): Promise<void> {
  const [summaryResult, qaResult] = await Promise.allSettled([
    summarizeCall(transcript),
    scoreQA(transcript),
  ]);

  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const qa = qaResult.status === 'fulfilled' ? qaResult.value : null;

  try {
    const client = supabaseAdmin();

    await client.from('calls').upsert(
      {
        id: callId,
        agent_id: meta.agentId ?? null,
        contact_id: meta.contactId ?? null,
        ended_at: new Date().toISOString(),
        duration_s: meta.durationSeconds ?? null,
        disposition: summary?.disposition ?? null,
        summary: summary?.text ?? null,
        qa_score: qa?.total ?? null,
        csat_pred: summary?.csatPrediction ?? null,
        processed: true,
      },
      { onConflict: 'id' },
    );

    if (qa) {
      await client.from('qa_scores').insert({
        call_id: callId,
        scores: qa.scores,
        total: qa.total,
        highlights: qa.highlights,
        improvements: qa.improvements,
      });
    }
  } catch (err) {
    console.error('post-call DB write failed', { callId, err: (err as Error).message });
  }

  publish(callId, {
    type: 'post_call_summary',
    summary,
    qaScore: qa,
  });
}
