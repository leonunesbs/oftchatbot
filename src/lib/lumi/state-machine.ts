import { contactProfileStore } from "@/lib/contact-profile/store";
import { askMissingField, bookingSuccessReply, confirmationReply, fallbackReply, faqReply, faqStrategicReply, handoffReply, introGreeting, slotOptionsReply, triageUrgentReply } from "@/lib/lumi/copy";
import { extractEntities, isValidEmail, normalizePhone } from "@/lib/lumi/entities";
import { educationalFaq } from "@/lib/lumi/config/clinic";
import { calComAdapter } from "@/lib/lumi/integrations/calcom";
import { detectIntent, isAffirmative, isGreetingMessage, isNegative } from "@/lib/lumi/intents";
import { requiresClinicalGuardrail, guardrailReply } from "@/lib/lumi/guardrails";
import { trackLumiEvent } from "@/lib/lumi/telemetry";
import type { LumiCollectedData, LumiSession, LumiState, LumiTurnDecision, LumiTurnInput } from "@/lib/lumi/types";

function nowIso(now?: Date) {
  return (now ?? new Date()).toISOString();
}

function defaultSession(chatId: string, now?: Date): LumiSession {
  const timestamp = nowIso(now);
  return {
    chatId,
    state: "START",
    collected: {},
    validationFailures: 0,
    handoffActive: false,
    lastInteractionAt: timestamp,
    updatedAt: timestamp,
  };
}

function mergeCollectedData(current: LumiCollectedData, incoming: Partial<LumiCollectedData>): LumiCollectedData {
  return {
    ...current,
    ...incoming,
    datePreference: incoming.datePreference ?? current.datePreference,
    slotOptions: incoming.slotOptions ?? current.slotOptions,
  };
}

function nextMissingRequiredField(data: LumiCollectedData): keyof LumiCollectedData | undefined {
  const required: Array<keyof LumiCollectedData> = ["fullName", "phone", "location", "consultationType", "datePreference"];
  return required.find((field) => !data[field]);
}

function stateByField(field: keyof LumiCollectedData): LumiState {
  switch (field) {
    case "fullName":
      return "SCHEDULING_COLLECT_NAME";
    case "phone":
      return "SCHEDULING_COLLECT_PHONE";
    case "email":
      return "SCHEDULING_COLLECT_EMAIL";
    case "location":
      return "SCHEDULING_COLLECT_LOCATION";
    case "consultationType":
      return "SCHEDULING_COLLECT_TYPE";
    case "datePreference":
      return "SCHEDULING_COLLECT_DATE_PREF";
    default:
      return "TRIAGE";
  }
}

function trySelectSlotFromText(text: string, slots: NonNullable<LumiCollectedData["slotOptions"]>) {
  const match = text.match(/\b([1-4])\b/);
  if (!match) {
    return undefined;
  }
  const index = Number(match[1]) - 1;
  return slots[index]?.id;
}

function isUrgentIntent(text: string) {
  const intent = detectIntent(text);
  return intent.intent === "urgent_symptoms";
}

function resolveFaqTopic(text: string) {
  const normalized = text.toLowerCase();
  const topics = Object.keys(educationalFaq);
  return topics.find((topic) => normalized.includes(topic));
}

function extractContextualEntities(messageText: string, state: LumiState): Partial<LumiCollectedData> {
  const extracted: Partial<LumiCollectedData> = {};
  const trimmed = messageText.trim().replaceAll(/\s+/g, " ");
  if (!trimmed) {
    return extracted;
  }

  if (state === "SCHEDULING_COLLECT_NAME") {
    const looksLikeName = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-\s]{1,79}$/.test(trimmed) && !/\d/.test(trimmed);
    if (looksLikeName) {
      extracted.fullName = trimmed;
    }
  }

  return extracted;
}

export async function runLumiTurn(input: LumiTurnInput): Promise<LumiTurnDecision> {
  const currentSession = contactProfileStore.getLumiSession(input.chatId) ?? defaultSession(input.chatId, input.now);
  const intent = detectIntent(input.messageText);
  const extractedEntities = extractEntities(input.messageText);
  const contextualEntities = extractContextualEntities(input.messageText, currentSession.state);
  const entities: Partial<LumiCollectedData> = {
    ...contextualEntities,
    ...extractedEntities,
  };
  const merged = mergeCollectedData(currentSession.collected, entities);

  trackLumiEvent("intent_detected", {
    chatId: input.chatId,
    intent: intent.intent,
    state: currentSession.state,
    now: input.now,
  });

  if (requiresClinicalGuardrail(input.messageText)) {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "HANDOFF_WHATSAPP",
      handoffActive: true,
      lastIntent: intent.intent,
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    trackLumiEvent("handoff_triggered", { chatId: input.chatId, intent: intent.intent, state: nextSession.state, now: input.now });
    return {
      nextState: "HANDOFF_WHATSAPP",
      replyText: `${guardrailReply()}\n\n${handoffReply("te orientar com segurança")}`,
      shouldSend: true,
      handoffTriggered: true,
    };
  }

  if (intent.intent === "urgent_symptoms" || isUrgentIntent(input.messageText)) {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "END",
      collected: merged,
      handoffActive: true,
      lastIntent: "urgent_symptoms",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    trackLumiEvent("urgent_triage_triggered", { chatId: input.chatId, intent: "urgent_symptoms", state: "END", now: input.now });
    return {
      nextState: "END",
      replyText: triageUrgentReply(),
      shouldSend: true,
      endFlow: true,
      handoffTriggered: true,
    };
  }

  if (intent.intent === "talk_to_human" || intent.intent === "ask_pricing" || intent.intent === "ask_insurance") {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "HANDOFF_WHATSAPP",
      collected: merged,
      handoffActive: true,
      lastIntent: intent.intent,
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    trackLumiEvent("handoff_triggered", { chatId: input.chatId, intent: intent.intent, state: nextSession.state, now: input.now });
    return {
      nextState: "HANDOFF_WHATSAPP",
      replyText: handoffReply("te passar informações específicas de valores e convênios"),
      shouldSend: true,
      handoffTriggered: true,
    };
  }

  if (intent.intent === "reschedule" || intent.intent === "cancel") {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "HANDOFF_WHATSAPP",
      collected: merged,
      handoffActive: true,
      lastIntent: intent.intent,
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    trackLumiEvent("handoff_triggered", { chatId: input.chatId, intent: intent.intent, state: nextSession.state, now: input.now });
    return {
      nextState: "HANDOFF_WHATSAPP",
      replyText: handoffReply("reagendamento ou cancelamento"),
      shouldSend: true,
      handoffTriggered: true,
    };
  }

  if (
    isGreetingMessage(input.messageText) &&
    !currentSession.state.startsWith("SCHEDULING_") &&
    currentSession.state !== "HANDOFF_WHATSAPP"
  ) {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "TRIAGE",
      collected: merged,
      lastIntent: "greeting",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    return {
      nextState: "TRIAGE",
      replyText: introGreeting(input.contactName),
      shouldSend: true,
    };
  }

  if (intent.intent === "ask_services" || intent.intent === "ask_hours" || intent.intent === "ask_location") {
    const faqTopic = resolveFaqTopic(input.messageText);
    let text = fallbackReply();
    if (intent.intent === "ask_hours") {
      text = "Entendi. Nosso horário de atendimento é de segunda a sexta, 8h às 18h, e sábado, 8h às 12h.";
    } else if (intent.intent === "ask_location") {
      text = "Claro. Atendemos em Fortaleza (Aldeota). Se quiser, te envio o link do mapa: https://maps.google.com/?q=Aldeota+Fortaleza";
    } else if (faqTopic) {
      text = faqReply(faqTopic, educationalFaq[faqTopic] ?? fallbackReply());
    }

    const nextSession: LumiSession = {
      ...currentSession,
      state: "FAQ_ROUTER",
      collected: merged,
      lastIntent: intent.intent,
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    return {
      nextState: "FAQ_ROUTER",
      replyText: text,
      strategicReplyText: faqStrategicReply(faqTopic),
      shouldSend: true,
    };
  }

  const schedulingRequested =
    currentSession.state.startsWith("SCHEDULING_") ||
    intent.intent === "schedule_appointment" ||
    isAffirmative(input.messageText) ||
    Boolean(entities.datePreference || entities.fullName || entities.phone || entities.consultationType || entities.location);

  if (!schedulingRequested) {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "TRIAGE",
      collected: merged,
      lastIntent: intent.intent,
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    trackLumiEvent("fallback_hit", { chatId: input.chatId, intent: intent.intent, state: nextSession.state, now: input.now });
    return {
      nextState: "TRIAGE",
      replyText: intent.intent === "greeting" ? introGreeting(input.contactName) : fallbackReply(),
      shouldSend: true,
    };
  }

  trackLumiEvent("scheduling_started", {
    chatId: input.chatId,
    intent: intent.intent,
    state: currentSession.state,
    now: input.now,
  });

  const slotIdFromChoice = merged.slotOptions ? trySelectSlotFromText(input.messageText, merged.slotOptions) : undefined;
  if (slotIdFromChoice) {
    merged.selectedSlotId = slotIdFromChoice;
  }

  if (entities.email && !isValidEmail(entities.email)) {
    const failures = currentSession.validationFailures + 1;
    const handoff = failures >= 2;
    const nextSession: LumiSession = {
      ...currentSession,
      state: handoff ? "HANDOFF_WHATSAPP" : "SCHEDULING_COLLECT_EMAIL",
      collected: merged,
      validationFailures: failures,
      handoffActive: handoff,
      lastIntent: "schedule_appointment",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    if (handoff) {
      trackLumiEvent("handoff_triggered", { chatId: input.chatId, state: nextSession.state, now: input.now });
      return {
        nextState: nextSession.state,
        replyText: handoffReply("validar seu contato com mais precisão"),
        shouldSend: true,
        handoffTriggered: true,
      };
    }
    return {
      nextState: "SCHEDULING_COLLECT_EMAIL",
      replyText: "Obrigado por enviar. O e-mail parece inválido. Pode me passar novamente?",
      shouldSend: true,
    };
  }

  if (entities.phone && !normalizePhone(entities.phone)) {
    const failures = currentSession.validationFailures + 1;
    const handoff = failures >= 2;
    const nextSession: LumiSession = {
      ...currentSession,
      state: handoff ? "HANDOFF_WHATSAPP" : "SCHEDULING_COLLECT_PHONE",
      collected: merged,
      validationFailures: failures,
      handoffActive: handoff,
      lastIntent: "schedule_appointment",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    if (handoff) {
      trackLumiEvent("handoff_triggered", { chatId: input.chatId, state: nextSession.state, now: input.now });
      return {
        nextState: nextSession.state,
        replyText: handoffReply("confirmar seu telefone"),
        shouldSend: true,
        handoffTriggered: true,
      };
    }
    return {
      nextState: "SCHEDULING_COLLECT_PHONE",
      replyText: "Entendi. O telefone não parece completo. Pode enviar com DDD?",
      shouldSend: true,
    };
  }

  const missingField = nextMissingRequiredField(merged);
  if (missingField) {
    const nextSession: LumiSession = {
      ...currentSession,
      state: stateByField(missingField),
      collected: merged,
      lastIntent: "schedule_appointment",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    return {
      nextState: nextSession.state,
      replyText: askMissingField(missingField),
      shouldSend: true,
    };
  }

  if (!merged.slotOptions || merged.slotOptions.length === 0) {
    const slots = await calComAdapter.getSlots({
      location: merged.location ?? "Fortaleza",
      consultationType: merged.consultationType ?? "consulta geral",
      dateIso: merged.datePreference?.isoDate,
      period: merged.datePreference?.period,
    });

    merged.slotOptions = slots;
    const nextSession: LumiSession = {
      ...currentSession,
      state: "SCHEDULING_SHOW_SLOTS",
      collected: merged,
      lastIntent: "schedule_appointment",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    return {
      nextState: nextSession.state,
      replyText: slotOptionsReply(slots),
      shouldSend: true,
    };
  }

  if (!merged.selectedSlotId) {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "SCHEDULING_SHOW_SLOTS",
      collected: merged,
      lastIntent: "schedule_appointment",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    return {
      nextState: "SCHEDULING_SHOW_SLOTS",
      replyText: slotOptionsReply(merged.slotOptions),
      shouldSend: true,
    };
  }

  const selectedSlot = merged.slotOptions.find((slot) => slot.id === merged.selectedSlotId);
  if (currentSession.state !== "SCHEDULING_CONFIRM" || !isAffirmative(input.messageText)) {
    const nextSession: LumiSession = {
      ...currentSession,
      state: "SCHEDULING_CONFIRM",
      collected: merged,
      lastIntent: "schedule_appointment",
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);

    if (isNegative(input.messageText)) {
      merged.selectedSlotId = undefined;
      merged.slotOptions = [];
      contactProfileStore.upsertLumiSession({
        ...nextSession,
        state: "SCHEDULING_SHOW_SLOTS",
        collected: merged,
      });
      return {
        nextState: "SCHEDULING_SHOW_SLOTS",
        replyText: "Tudo bem. Vou buscar novas opções de horário para você.",
        shouldSend: true,
      };
    }

    return {
      nextState: "SCHEDULING_CONFIRM",
      replyText: confirmationReply(merged, selectedSlot),
      shouldSend: true,
    };
  }

  const booking = await calComAdapter.book({
    slotId: merged.selectedSlotId,
    fullName: merged.fullName ?? "Paciente",
    phone: merged.phone ?? "",
    email: merged.email,
    location: merged.location ?? "",
    consultationType: merged.consultationType ?? "consulta geral",
  });

  const nextSession: LumiSession = {
    ...currentSession,
    state: "END",
    collected: merged,
    lastIntent: "schedule_appointment",
    lastInteractionAt: nowIso(input.now),
    updatedAt: nowIso(input.now),
  };
  contactProfileStore.upsertLumiSession(nextSession);
  trackLumiEvent("scheduling_completed", {
    chatId: input.chatId,
    intent: "schedule_appointment",
    state: "END",
    now: input.now,
    metadata: { source: booking.source },
  });

  return {
    nextState: "END",
    replyText: bookingSuccessReply(booking.protocol),
    shouldSend: true,
    endFlow: true,
  };
}
