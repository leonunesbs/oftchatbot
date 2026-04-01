import { createHash } from "node:crypto";

import type { LumiTelemetryEvent, LumiTelemetryEventName } from "@/lib/lumi/types";

const recentLumiEvents: LumiTelemetryEvent[] = [];
const MAX_RECENT_EVENTS = 300;

function hashChatId(chatId: string) {
  return createHash("sha256").update(chatId).digest("hex").slice(0, 20);
}

export function trackLumiEvent(
  event: LumiTelemetryEventName,
  payload: {
    chatId: string;
    intent?: LumiTelemetryEvent["intent"];
    state?: LumiTelemetryEvent["state"];
    metadata?: LumiTelemetryEvent["metadata"];
    now?: Date;
  }
) {
  const now = payload.now ?? new Date();
  const telemetryEvent: LumiTelemetryEvent = {
    event,
    chatIdHash: hashChatId(payload.chatId),
    intent: payload.intent,
    state: payload.state,
    timezone: "America/Fortaleza",
    timestamp: now.toISOString(),
    metadata: payload.metadata,
  };

  recentLumiEvents.unshift(telemetryEvent);
  if (recentLumiEvents.length > MAX_RECENT_EVENTS) {
    recentLumiEvents.length = MAX_RECENT_EVENTS;
  }

  console.info("[LUMI telemetry]", JSON.stringify(telemetryEvent));
}

export function getRecentLumiEvents() {
  return [...recentLumiEvents];
}
