export const lumiStates = [
  "START",
  "TRIAGE",
  "FAQ_ROUTER",
  "SCHEDULING_COLLECT_NAME",
  "SCHEDULING_COLLECT_PHONE",
  "SCHEDULING_COLLECT_EMAIL",
  "SCHEDULING_COLLECT_LOCATION",
  "SCHEDULING_COLLECT_TYPE",
  "SCHEDULING_COLLECT_DATE_PREF",
  "SCHEDULING_SHOW_SLOTS",
  "SCHEDULING_CONFIRM",
  "HANDOFF_WHATSAPP",
  "END",
] as const;

export type LumiState = (typeof lumiStates)[number];

export const lumiIntents = [
  "greeting",
  "ask_hours",
  "ask_location",
  "ask_pricing",
  "ask_insurance",
  "ask_services",
  "urgent_symptoms",
  "schedule_appointment",
  "reschedule",
  "cancel",
  "talk_to_human",
  "fallback",
] as const;

export type LumiIntent = (typeof lumiIntents)[number];

export type DatePreference = {
  raw: string;
  period?: "manha" | "tarde" | "noite";
  isoDate?: string;
};

export type SlotOption = {
  id: string;
  startAt: string;
  endAt: string;
  label: string;
  location: string;
  consultationType: string;
  source: "calcom" | "mock";
};

export type LumiCollectedData = {
  fullName?: string;
  phone?: string;
  email?: string;
  location?: string;
  consultationType?: string;
  datePreference?: DatePreference;
  selectedSlotId?: string;
  slotOptions?: SlotOption[];
};

export type LumiSession = {
  chatId: string;
  state: LumiState;
  collected: LumiCollectedData;
  validationFailures: number;
  handoffActive: boolean;
  lastIntent?: LumiIntent;
  lastInteractionAt: string;
  updatedAt: string;
};

export type DetectedIntent = {
  intent: LumiIntent;
  score: number;
  matchedBy: string;
};

export type LumiTurnInput = {
  chatId: string;
  messageText: string;
  contactName?: string;
  now?: Date;
};

export type LumiTurnDecision = {
  nextState: LumiState;
  replyText: string;
  strategicReplyText?: string;
  shouldSend: boolean;
  endFlow?: boolean;
  handoffTriggered?: boolean;
};

export type LumiTelemetryEventName =
  | "intent_detected"
  | "scheduling_started"
  | "scheduling_completed"
  | "urgent_triage_triggered"
  | "handoff_triggered"
  | "fallback_hit";

export type LumiTelemetryEvent = {
  event: LumiTelemetryEventName;
  chatIdHash: string;
  intent?: LumiIntent;
  state?: LumiState;
  timezone: "America/Fortaleza";
  timestamp: string;
  metadata?: Record<string, string | number | boolean | undefined>;
};
