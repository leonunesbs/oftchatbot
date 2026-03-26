import type { APIRoute } from "astro";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { subscribeToSession, type SessionEvent } from "@/lib/live-session/store";

export const prerender = false;

const encoder = new TextEncoder();
const HEARTBEAT_MS = 15_000;

function normalizePin(pin: string | null) {
  if (!pin) return null;
  const normalized = pin.trim();
  if (!/^\d{4}$/.test(normalized)) return null;
  return normalized;
}

function toSseMessage(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export const GET: APIRoute = async ({ request, url }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "live-session:stream",
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const pin = normalizePin(url.searchParams.get("pin"));
  if (!pin) {
    return new Response(JSON.stringify({ error: "PIN must have 4 digits" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      const safeEnqueue = (chunk: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          isClosed = true;
        }
      };

      const subscription = subscribeToSession(pin, (event: SessionEvent) => {
        if (event.type === "state") {
          safeEnqueue(toSseMessage("state", event.session));
          return;
        }

        safeEnqueue(
          toSseMessage("closed", {
            session: event.session,
            reason: event.reason,
          }),
        );
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      });

      if (!subscription) {
        safeEnqueue(toSseMessage("closed", { reason: "not-found" }));
        isClosed = true;
        controller.close();
        cleanup = null;
        return;
      }

      safeEnqueue(toSseMessage("state", subscription.session));
      const heartbeatTimer = setInterval(() => {
        safeEnqueue(toSseMessage("heartbeat", { at: new Date().toISOString() }));
      }, HEARTBEAT_MS);

      const abortHandler = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(heartbeatTimer);
        subscription.unsubscribe();
        controller.close();
      };

      request.signal.addEventListener("abort", abortHandler, { once: true });

      cleanup = () => {
        clearInterval(heartbeatTimer);
        subscription.unsubscribe();
        request.signal.removeEventListener("abort", abortHandler);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
};

