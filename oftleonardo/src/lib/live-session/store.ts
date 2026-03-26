import {
  ACUITY_LEVELS,
  AVAILABLE_DISTANCES,
  DEFAULT_DISTANCE_M,
} from "@/components/visual-acuity/constants";

type EyeSide = "OD" | "OS";
type OptotypeMode = "tumbling-e" | "snellen-letters";
export type SessionStatus = "active" | "completed" | "expired";

export interface LiveSessionState {
  sessionId: string;
  pin: string;
  status: SessionStatus;
  chartSeed: string;
  distanceM: number;
  optotypeMode: OptotypeMode;
  currentEye: EyeSide;
  currentIndex: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface CreateSessionResult {
  session: LiveSessionState;
  ownerToken: string;
}

export interface JoinSessionResult {
  session: LiveSessionState;
}

export interface SessionAdvanceInput {
  pin: string;
  ownerToken: string;
  action: "previous" | "next" | "cant-see" | "can-see-all" | "finish";
}

export interface SessionEvent {
  type: "state" | "closed";
  session: LiveSessionState;
  reason?: "expired" | "finished";
}

type SessionSubscriber = (event: SessionEvent) => void;

interface LiveSessionRecord {
  sessionId: string;
  pin: string;
  ownerToken: string;
  status: SessionStatus;
  chartSeed: string;
  distanceM: number;
  optotypeMode: OptotypeMode;
  currentEye: EyeSide;
  currentIndex: number;
  createdAtMs: number;
  updatedAtMs: number;
  expiresAtMs: number;
  subscribers: Set<SessionSubscriber>;
}

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_PIN_GENERATION_ATTEMPTS = 20;
const FIRST_PIN = 1000;
const LAST_PIN = 9999;
const MAX_INDEX = ACUITY_LEVELS.length - 1;
const sessionsByPin = new Map<string, LiveSessionRecord>();

function nowMs() {
  return Date.now();
}

function toIso(ms: number) {
  return new Date(ms).toISOString();
}

function randomToken() {
  return crypto.randomUUID();
}

function randomSessionId() {
  return crypto.randomUUID();
}

function touchSession(record: LiveSessionRecord) {
  const updatedAtMs = nowMs();
  record.updatedAtMs = updatedAtMs;
  record.expiresAtMs = updatedAtMs + SESSION_TTL_MS;
}

function toPublicSession(record: LiveSessionRecord): LiveSessionState {
  return {
    sessionId: record.sessionId,
    pin: record.pin,
    status: record.status,
    chartSeed: record.chartSeed,
    distanceM: record.distanceM,
    optotypeMode: record.optotypeMode,
    currentEye: record.currentEye,
    currentIndex: record.currentIndex,
    createdAt: toIso(record.createdAtMs),
    updatedAt: toIso(record.updatedAtMs),
    expiresAt: toIso(record.expiresAtMs),
  };
}

function emit(record: LiveSessionRecord, event: SessionEvent) {
  for (const subscriber of record.subscribers) {
    subscriber(event);
  }
}

function expireSession(record: LiveSessionRecord) {
  record.status = "expired";
  touchSession(record);
  emit(record, {
    type: "closed",
    reason: "expired",
    session: toPublicSession(record),
  });
  record.subscribers.clear();
  sessionsByPin.delete(record.pin);
}

function sweepExpiredSessions() {
  const now = nowMs();
  for (const record of sessionsByPin.values()) {
    if (record.expiresAtMs <= now) {
      expireSession(record);
    }
  }
}

function getActiveRecord(pin: string) {
  sweepExpiredSessions();
  const record = sessionsByPin.get(pin);
  if (!record) return null;
  if (record.status !== "active") return null;
  return record;
}

function generatePin(): string {
  for (let i = 0; i < MAX_PIN_GENERATION_ATTEMPTS; i += 1) {
    const candidate = Math.floor(Math.random() * (LAST_PIN - FIRST_PIN + 1) + FIRST_PIN).toString();
    if (!sessionsByPin.has(candidate)) {
      return candidate;
    }
  }

  throw new Error("Could not generate session PIN");
}

function closeAsFinished(record: LiveSessionRecord) {
  record.status = "completed";
  touchSession(record);
  emit(record, {
    type: "closed",
    reason: "finished",
    session: toPublicSession(record),
  });
  record.subscribers.clear();
  sessionsByPin.delete(record.pin);
}

export function createSession(): CreateSessionResult {
  sweepExpiredSessions();
  const createdAtMs = nowMs();
  const record: LiveSessionRecord = {
    sessionId: randomSessionId(),
    pin: generatePin(),
    ownerToken: randomToken(),
    status: "active",
    chartSeed: randomToken(),
    distanceM: DEFAULT_DISTANCE_M,
    optotypeMode: "tumbling-e",
    currentEye: "OD",
    currentIndex: 0,
    createdAtMs,
    updatedAtMs: createdAtMs,
    expiresAtMs: createdAtMs + SESSION_TTL_MS,
    subscribers: new Set(),
  };

  sessionsByPin.set(record.pin, record);

  return {
    session: toPublicSession(record),
    ownerToken: record.ownerToken,
  };
}

export function joinSession(pin: string): JoinSessionResult | null {
  const record = getActiveRecord(pin);
  if (!record) return null;

  touchSession(record);
  return { session: toPublicSession(record) };
}

export function subscribeToSession(pin: string, subscriber: SessionSubscriber) {
  const record = getActiveRecord(pin);
  if (!record) return null;

  touchSession(record);
  record.subscribers.add(subscriber);

  return {
    session: toPublicSession(record),
    unsubscribe: () => {
      record.subscribers.delete(subscriber);
    },
  };
}

export function advanceSession(input: SessionAdvanceInput): LiveSessionState | null {
  const record = getActiveRecord(input.pin);
  if (!record) return null;
  if (record.ownerToken !== input.ownerToken) return null;

  switch (input.action) {
    case "previous": {
      if (record.currentIndex > 0) {
        record.currentIndex -= 1;
      }
      break;
    }
    case "next": {
      if (record.currentIndex < MAX_INDEX) {
        record.currentIndex += 1;
      }
      break;
    }
    case "cant-see":
    case "can-see-all": {
      if (record.currentEye === "OD") {
        record.currentEye = "OS";
        record.currentIndex = 0;
      } else {
        closeAsFinished(record);
        return null;
      }
      break;
    }
    case "finish": {
      closeAsFinished(record);
      return null;
    }
  }

  touchSession(record);
  const state = toPublicSession(record);
  emit(record, { type: "state", session: state });
  return state;
}

export function setSessionConfiguration(input: {
  pin: string;
  ownerToken: string;
  mode?: OptotypeMode;
  distanceM?: number;
}): LiveSessionState | null {
  const record = getActiveRecord(input.pin);
  if (!record) return null;
  if (record.ownerToken !== input.ownerToken) return null;

  if (input.distanceM !== undefined) {
    const isSupportedDistance = AVAILABLE_DISTANCES.some(
      (distance) => distance.meters === input.distanceM,
    );
    if (!isSupportedDistance) return null;
  }

  const nextMode = input.mode ?? record.optotypeMode;
  const nextDistanceM = input.distanceM ?? record.distanceM;
  if (record.optotypeMode === nextMode && record.distanceM === nextDistanceM) {
    return toPublicSession(record);
  }

  record.optotypeMode = nextMode;
  record.distanceM = nextDistanceM;
  touchSession(record);
  const state = toPublicSession(record);
  emit(record, { type: "state", session: state });
  return state;
}

