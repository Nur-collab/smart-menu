import { registerSseClient } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  let unregister: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      unregister = registerSseClient(controller);
    },
    cancel() {
      if (unregister) {
        unregister();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
