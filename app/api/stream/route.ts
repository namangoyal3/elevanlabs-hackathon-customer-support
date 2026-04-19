import { subscribe, type SseEvent } from '@/lib/sse-bus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_MS = 15_000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const callId = url.searchParams.get('callId');
  if (!callId) return new Response('callId required', { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: SseEvent) => {
        const chunk = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // controller closed
        }
      };

      const close = () => {
        try {
          controller.close();
        } catch {}
      };

      // Greet — lets the client know the bus is live before any real event.
      send({ type: 'sentiment', score: 0 });

      const unsubscribe = subscribe(callId, { send, close });

      // Heartbeat comment — keeps the connection alive through proxies.
      const hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(hb);
        }
      }, HEARTBEAT_MS);

      // Cancel cleanup
      req.signal.addEventListener('abort', () => {
        clearInterval(hb);
        unsubscribe();
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
