import { getRecentWahaEvents, subscribeWahaEvents } from "@/lib/waha/event-bus";

function formatSseChunk(eventName: string, payload: unknown) {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;
  let isClosed = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined;

  const cleanup = () => {
    if (isClosed) return;
    isClosed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = undefined;
    }
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
    if (controllerRef) {
      try {
        controllerRef.close();
      } catch {
        // Stream may already be closed by runtime/client disconnect.
      }
      controllerRef = undefined;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
      const encoder = new TextEncoder();
      const safeEnqueue = (chunk: string) => {
        if (isClosed || controller.desiredSize === null) {
          cleanup();
          return;
        }
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Client disconnected and stream is no longer writable.
          cleanup();
        }
      };

      const events = getRecentWahaEvents();
      safeEnqueue(formatSseChunk("bootstrap", events));

      heartbeat = setInterval(() => {
        safeEnqueue(": heartbeat\n\n");
      }, 20_000);

      unsubscribe = subscribeWahaEvents((event) => {
        safeEnqueue(formatSseChunk("waha-event", event));
      });
    },
    cancel() {
      cleanup();
    },
  });

  request.signal.addEventListener("abort", cleanup, { once: true });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}
