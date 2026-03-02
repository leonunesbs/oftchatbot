import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { emitWahaEvent } from "@/lib/waha/event-bus";
import type { WahaEvent } from "@/lib/waha/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 });
}

function buildEvent(rawPayload: unknown) {
  const payload = rawPayload as Record<string, unknown>;
  const messagePayload =
    payload?.payload && typeof payload.payload === "object" ? (payload.payload as Record<string, unknown>) : undefined;

  const fromMe = typeof messagePayload?.fromMe === "boolean" ? messagePayload.fromMe : false;
  const chatId =
    typeof payload?.chatId === "string"
      ? payload.chatId
      : typeof payload?.id === "string"
        ? payload.id
        : typeof messagePayload?.chatId === "string"
          ? messagePayload.chatId
          : typeof messagePayload?.id === "string"
            ? messagePayload.id
            : fromMe && typeof messagePayload?.to === "string"
              ? messagePayload.to
              : typeof messagePayload?.from === "string"
                ? messagePayload.from
        : undefined;

  const session = typeof payload?.session === "string" ? payload.session : undefined;
  const eventName = typeof payload?.event === "string" ? payload.event : "unknown";

  const event: WahaEvent = {
    id: crypto.randomUUID(),
    event: eventName,
    session,
    chatId,
    payload: rawPayload,
    receivedAt: Date.now(),
  };

  return event;
}

export async function POST(request: NextRequest) {
  const callerIp = request.headers.get("x-forwarded-for") ?? "unknown";
  const limiter = rateLimit(`waha-webhook:${callerIp}`, 60_000, 600);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const configuredSecret = serverEnv.WAHA_WEBHOOK_SECRET;
  if (configuredSecret) {
    const receivedSecret = request.headers.get("x-waha-secret");
    if (!receivedSecret || receivedSecret !== configuredSecret) {
      return unauthorized();
    }
  }

  const body = await request.json();
  const event = buildEvent(body);
  emitWahaEvent(event);
  console.info("[WAHA webhook]", JSON.stringify({ event: event.event, eventId: event.id, session: event.session }));

  return NextResponse.json({ ok: true, eventId: event.id });
}
