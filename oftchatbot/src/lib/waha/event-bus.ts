import type { WahaEvent } from "@/lib/waha/types";

type Listener = (event: WahaEvent) => void;

const listeners = new Set<Listener>();
const recentEvents: WahaEvent[] = [];
const MAX_RECENT_EVENTS = 100;

export function emitWahaEvent(event: WahaEvent) {
  recentEvents.unshift(event);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.length = MAX_RECENT_EVENTS;
  }

  for (const listener of listeners) {
    listener(event);
  }
}

export function subscribeWahaEvents(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRecentWahaEvents() {
  return [...recentEvents];
}
