import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env/server";
import { runLumiTurn } from "@/lib/lumi";
import { rateLimit } from "@/lib/security/rate-limit";
import { requestWaha } from "@/lib/waha/http-client";
import { chatsDomain } from "@/lib/waha/domains/chats";
import { emitWahaEvent } from "@/lib/waha/event-bus";
import type { WahaEvent } from "@/lib/waha/types";

export const runtime = "nodejs";
const processedIncomingMessages = new Map<string, number>();
const PROCESSED_MESSAGE_TTL_MS = 2 * 60 * 1000;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 });
}

function ignored() {
  return NextResponse.json({ ok: true, ignored: true }, { status: 202 });
}

function getConfiguredWebhookSecrets() {
  const candidates = [serverEnv.WAHA_WEBHOOK_SECRET, serverEnv.WAHA_API_KEY]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
  return [...new Set(candidates)];
}

function getPresentedWebhookSecret(request: NextRequest) {
  const url = new URL(request.url);
  const bearerHeader = request.headers.get("authorization");
  const bearerMatch = bearerHeader?.match(/^Bearer\s+(.+)$/i);

  return (
    asString(request.headers.get("x-waha-secret")) ??
    asString(request.headers.get("x-webhook-secret")) ??
    asString(request.headers.get("x-api-key")) ??
    asString(bearerMatch?.[1]) ??
    asString(url.searchParams.get("secret")) ??
    asString(url.searchParams.get("token"))
  );
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

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isLikelyChatId(value: unknown) {
  const normalized = asString(value);
  return typeof normalized === "string" && normalized.includes("@");
}

function pickFirstLikelyChatId(...values: Array<unknown>) {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized && isLikelyChatId(normalized)) {
      return normalized;
    }
  }
  return undefined;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomBetween(minInclusive: number, maxInclusive: number) {
  if (maxInclusive <= minInclusive) {
    return minInclusive;
  }
  const span = maxInclusive - minInclusive + 1;
  return Math.floor(Math.random() * span) + minInclusive;
}

function registerIncomingMessage(key: string) {
  const now = Date.now();
  for (const [storedKey, storedAt] of processedIncomingMessages) {
    if (now - storedAt > PROCESSED_MESSAGE_TTL_MS) {
      processedIncomingMessages.delete(storedKey);
    }
  }
  if (processedIncomingMessages.has(key)) {
    return false;
  }
  processedIncomingMessages.set(key, now);
  return true;
}

function extractIncomingMessage(rawPayload: unknown) {
  const payload = asRecord(rawPayload);
  if (!payload) {
    return null;
  }

  const nestedPayload = asRecord(payload.payload);
  const message = nestedPayload ?? payload;
  const fromMe = message?.fromMe === true;
  if (fromMe) {
    return null;
  }

  const eventName = asString(payload.event) ?? asString(message.event);
  if (eventName && !eventName.toLowerCase().includes("message")) {
    return null;
  }

  const text =
    asString(message.body) ??
    asString(message.text) ??
    asString(asRecord(message.message)?.conversation) ??
    asString(asRecord(asRecord(message.message)?.extendedTextMessage)?.text);
  if (!text) {
    return null;
  }

  const chatId = pickFirstLikelyChatId(
    payload.chatId,
    message.chatId,
    message.from,
    fromMe ? message.to : undefined,
    message.id,
    payload.id
  );
  if (!chatId) {
    return null;
  }

  const contactName =
    asString(message.notifyName) ??
    asString(message.pushName) ??
    asString(asRecord(message.sender)?.pushName) ??
    asString(asRecord(message.sender)?._data && asRecord(asRecord(message.sender)?._data)?.pushname);

  const stableMessageId =
    asString(asRecord(message.id)?._serialized) ??
    asString(asRecord(asRecord(message._data)?.id)?._serialized) ??
    asString(message.id) ??
    asString(payload.id);
  const messageKey = stableMessageId ?? `${chatId}:${text}`;

  return {
    chatId,
    text,
    contactName,
    messageKey,
  };
}

async function markIncomingAsSeen(chatId: string, session?: string) {
  // Anti-block behavior: avoid immediate read receipt.
  const seenDelayMs = randomBetween(2_000, 4_500);
  await sleep(seenDelayMs);

  await requestWaha({
    path: "sendSeen",
    method: "POST",
    body: {
      chatId,
      session: session ?? serverEnv.WAHA_DEFAULT_SESSION,
    },
  }).catch((error) => {
    console.warn(
      "[LUMI webhook] sendSeen failed",
      JSON.stringify({
        error: error instanceof Error ? error.message : "unknown",
        chatId,
      })
    );
  });
}

export async function POST(request: NextRequest) {
  const callerIp = request.headers.get("x-forwarded-for") ?? "unknown";
  const limiter = rateLimit(`waha-webhook:${callerIp}`, 60_000, 600);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const configuredSecrets = getConfiguredWebhookSecrets();
  if (configuredSecrets.length > 0) {
    const receivedSecret = getPresentedWebhookSecret(request);
    if (!receivedSecret) {
      return ignored();
    }
    if (!configuredSecrets.includes(receivedSecret)) {
      return unauthorized();
    }
  }

  const body = await request.json();
  const event = buildEvent(body);
  const incomingMessage = extractIncomingMessage(body);
  emitWahaEvent(event);
  console.info("[WAHA webhook]", JSON.stringify({ event: event.event, eventId: event.id, session: event.session }));

  if (incomingMessage) {
    try {
      if (!registerIncomingMessage(incomingMessage.messageKey)) {
        return NextResponse.json({ ok: true, eventId: event.id, duplicate: true });
      }

      // WAHA anti-blocking: acknowledge message as seen before processing.
      await markIncomingAsSeen(incomingMessage.chatId, event.session);

      const turn = await runLumiTurn({
        chatId: incomingMessage.chatId,
        messageText: incomingMessage.text,
        contactName: incomingMessage.contactName,
      });
      if (turn.shouldSend && turn.replyText.trim().length > 0) {
        await chatsDomain.sendText({
          chatId: incomingMessage.chatId,
          text: turn.replyText,
          session: event.session,
        });

        if (turn.strategicReplyText && turn.strategicReplyText.trim().length > 0) {
          const strategicDelayMs = randomBetween(800, 1400);
          await sleep(strategicDelayMs);
          await chatsDomain.sendText({
            chatId: incomingMessage.chatId,
            text: turn.strategicReplyText,
            session: event.session,
          }, { allowBotFollowUp: true });
        }
      }
    } catch (error) {
      console.error(
        "[LUMI webhook]",
        JSON.stringify({
          error: error instanceof Error ? error.message : "unknown",
          chatId: incomingMessage.chatId,
        })
      );
    }
  }

  return NextResponse.json({ ok: true, eventId: event.id });
}
