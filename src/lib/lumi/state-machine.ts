import {
  askMissingField,
  bookingStatusReply,
  bookingSuccessReply,
  fallbackReply,
  faqReply,
  faqStrategicReply,
  handoffReply,
  introGreeting,
  triageUrgentReply,
} from "@/lib/lumi/copy";
import {
  extractEntities,
  isValidEmail,
  normalizePhone,
} from "@/lib/lumi/entities";
import {
  guardrailReply,
  requiresClinicalGuardrail,
} from "@/lib/lumi/guardrails";
import {
  detectIntent,
  isAffirmative,
  isGreetingMessage,
} from "@/lib/lumi/intents";
import type {
  LumiCollectedData,
  LumiSession,
  LumiState,
  LumiTurnDecision,
  LumiTurnInput,
} from "@/lib/lumi/types";

import { contactProfileStore } from "@/lib/contact-profile/store";
import { educationalFaq } from "@/lib/lumi/config/clinic";
import { oftagendaAdapter } from "@/lib/lumi/integrations/oftagenda";
import { resolveLocationHint } from "@/lib/lumi/location-hint";
import { trackLumiEvent } from "@/lib/lumi/telemetry";

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

function mergeCollectedData(
  current: LumiCollectedData,
  incoming: Partial<LumiCollectedData>,
): LumiCollectedData {
  return {
    ...current,
    ...incoming,
    datePreference: incoming.datePreference ?? current.datePreference,
    slotOptions: incoming.slotOptions ?? current.slotOptions,
  };
}

function nextMissingRequiredField(
  data: LumiCollectedData,
): keyof LumiCollectedData | undefined {
  const required: Array<keyof LumiCollectedData> = [
    "fullName",
    "location",
    "consultationType",
    "email",
  ];
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

function isUrgentIntent(text: string) {
  const intent = detectIntent(text);
  return intent.intent === "urgent_symptoms";
}

function resolveFaqTopic(text: string) {
  const normalized = text.toLowerCase();
  if (
    normalized.includes("dmri") ||
    normalized.includes("degeneracao macular") ||
    normalized.includes("degeneração macular") ||
    normalized.includes("macula") ||
    normalized.includes("mácula")
  ) {
    return "retina";
  }
  const topics = Object.keys(educationalFaq);
  return topics.find((topic) => normalized.includes(topic));
}

function extractContextualEntities(
  messageText: string,
  state: LumiState,
): Partial<LumiCollectedData> {
  const extracted: Partial<LumiCollectedData> = {};
  const trimmed = messageText.trim().replaceAll(/\s+/g, " ");
  if (!trimmed) {
    return extracted;
  }

  if (state === "SCHEDULING_COLLECT_NAME") {
    const looksLikeName =
      /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-\s]{1,79}$/.test(trimmed) &&
      !/\d/.test(trimmed);
    if (looksLikeName) {
      extracted.fullName = trimmed;
    }
  }

  return extracted;
}

export async function runLumiTurn(
  input: LumiTurnInput,
): Promise<LumiTurnDecision> {
  const assistantMode = input.assistant ?? "lumi";
  const currentSession =
    contactProfileStore.getLumiSession(input.chatId) ??
    defaultSession(input.chatId, input.now);
  const contactProfile = contactProfileStore.get(
    input.chatId,
    input.contactName,
  );
  const intent = detectIntent(input.messageText);
  const extractedEntities = extractEntities(input.messageText);
  const contextualEntities = extractContextualEntities(
    input.messageText,
    currentSession.state,
  );
  const autoCollectedPhone = normalizePhone(contactProfile.phoneNumber);
  const entities: Partial<LumiCollectedData> = {
    ...contextualEntities,
    ...extractedEntities,
    phone:
      autoCollectedPhone ??
      extractedEntities.phone ??
      currentSession.collected.phone,
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
    trackLumiEvent("handoff_triggered", {
      chatId: input.chatId,
      intent: intent.intent,
      state: nextSession.state,
      now: input.now,
    });
    return {
      nextState: "HANDOFF_WHATSAPP",
      replyText: `${guardrailReply()}\n\n${handoffReply("te orientar com segurança")}`,
      shouldSend: true,
      handoffTriggered: true,
    };
  }

  if (
    intent.intent === "urgent_symptoms" ||
    isUrgentIntent(input.messageText)
  ) {
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
    trackLumiEvent("urgent_triage_triggered", {
      chatId: input.chatId,
      intent: "urgent_symptoms",
      state: "END",
      now: input.now,
    });
    return {
      nextState: "END",
      replyText: triageUrgentReply(),
      shouldSend: true,
      endFlow: true,
      handoffTriggered: true,
    };
  }

  if (
    intent.intent === "talk_to_human" ||
    intent.intent === "ask_pricing" ||
    intent.intent === "ask_insurance"
  ) {
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
    trackLumiEvent("handoff_triggered", {
      chatId: input.chatId,
      intent: intent.intent,
      state: nextSession.state,
      now: input.now,
    });
    return {
      nextState: "HANDOFF_WHATSAPP",
      replyText: handoffReply(
        "te passar informações específicas de valores e convênios",
      ),
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
    trackLumiEvent("handoff_triggered", {
      chatId: input.chatId,
      intent: intent.intent,
      state: nextSession.state,
      now: input.now,
    });
    return {
      nextState: "HANDOFF_WHATSAPP",
      replyText: handoffReply("reagendamento ou cancelamento"),
      shouldSend: true,
      handoffTriggered: true,
    };
  }

  if (intent.intent === "check_booking_status") {
    const latestBooking =
      currentSession.collected.latestBooking ?? merged.latestBooking;
    if (!latestBooking) {
      const nextSession: LumiSession = {
        ...currentSession,
        state: "TRIAGE",
        collected: merged,
        lastIntent: intent.intent,
        lastInteractionAt: nowIso(input.now),
        updatedAt: nowIso(input.now),
      };
      contactProfileStore.upsertLumiSession(nextSession);
      return {
        nextState: "TRIAGE",
        replyText:
          "Ainda nao encontrei um agendamento recente por aqui. Se quiser, posso iniciar um novo agendamento agora.",
        shouldSend: true,
      };
    }

    const status = await oftagendaAdapter.getBookingStatus({
      protocol: latestBooking.protocol,
      paymentUrl: latestBooking.paymentUrl,
      stripeCodes: merged.stripeCodes,
    });

    const nextSession: LumiSession = {
      ...currentSession,
      state: "TRIAGE",
      collected: merged,
      lastIntent: intent.intent,
      lastInteractionAt: nowIso(input.now),
      updatedAt: nowIso(input.now),
    };
    contactProfileStore.upsertLumiSession(nextSession);
    return {
      nextState: "TRIAGE",
      replyText: bookingStatusReply({
        protocol: latestBooking.protocol,
        paymentStatusText: status.paymentStatusText,
        bookingStatusText: status.bookingStatusText,
        paymentUrl: status.paymentUrl,
      }),
      shouldSend: true,
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
      replyText: introGreeting(input.contactName, assistantMode),
      shouldSend: true,
    };
  }

  if (
    !currentSession.state.startsWith("SCHEDULING_") &&
    (intent.intent === "ask_services" ||
      intent.intent === "ask_hours" ||
      intent.intent === "ask_location")
  ) {
    const faqTopic = resolveFaqTopic(input.messageText);
    let text = fallbackReply(assistantMode);
    if (intent.intent === "ask_hours") {
      text =
        "Entendi. Nosso horário de atendimento é de segunda a sexta, 8h às 18h, e sábado, 8h às 12h.";
    } else if (intent.intent === "ask_location") {
      text =
        "Claro. Atendemos em Fortaleza (Aldeota). Se quiser, te envio o link do mapa: https://maps.google.com/?q=Aldeota+Fortaleza";
    } else if (faqTopic) {
      text = faqReply(
        faqTopic,
        educationalFaq[faqTopic] ?? fallbackReply(assistantMode),
      );
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
      strategicReplyText: faqStrategicReply(faqTopic, assistantMode),
      shouldSend: true,
    };
  }

  const schedulingRequested =
    currentSession.state.startsWith("SCHEDULING_") ||
    intent.intent === "schedule_appointment" ||
    isAffirmative(input.messageText) ||
    Boolean(
      entities.datePreference ||
      entities.fullName ||
      entities.phone,
    );

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
    trackLumiEvent("fallback_hit", {
      chatId: input.chatId,
      intent: intent.intent,
      state: nextSession.state,
      now: input.now,
    });
    return {
      nextState: "TRIAGE",
      replyText:
        intent.intent === "greeting"
          ? introGreeting(input.contactName, assistantMode)
          : fallbackReply(assistantMode),
      shouldSend: true,
    };
  }

  trackLumiEvent("scheduling_started", {
    chatId: input.chatId,
    intent: intent.intent,
    state: currentSession.state,
    now: input.now,
  });

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
      trackLumiEvent("handoff_triggered", {
        chatId: input.chatId,
        state: nextSession.state,
        now: input.now,
      });
      return {
        nextState: nextSession.state,
        replyText: handoffReply("validar seu contato com mais precisão"),
        shouldSend: true,
        handoffTriggered: true,
      };
    }
    return {
      nextState: "SCHEDULING_COLLECT_EMAIL",
      replyText:
        "Obrigado por enviar. O e-mail parece inválido. Pode me passar novamente?",
      shouldSend: true,
    };
  }

  const missingField = nextMissingRequiredField(merged);
  if (missingField) {
    const locationHint =
      missingField === "location"
        ? await resolveLocationHint({
            phone: merged.phone ?? contactProfile.phoneNumber,
            sourceIp: input.sourceIp,
          })
        : undefined;
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
      replyText: askMissingField(missingField, { locationHint }),
      shouldSend: true,
    };
  }

  const booking = await oftagendaAdapter.book({
    slotId: `direct-link-${Date.now()}`,
    fullName: merged.fullName ?? "Paciente",
    phone: merged.phone ?? "",
    email: merged.email,
    location: merged.location ?? "",
    consultationType: merged.consultationType ?? "consulta geral",
  });

  merged.latestBooking = {
    protocol: booking.protocol,
    source: booking.source,
    paymentUrl: booking.paymentUrl,
    location: merged.location,
    consultationType: merged.consultationType,
    bookedAt: nowIso(input.now),
  };
  merged.stripeCodes = booking.stripeCodes ?? merged.stripeCodes;

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
    replyText: bookingSuccessReply(booking.paymentUrl, merged.phone),
    shouldSend: true,
    endFlow: true,
  };

}
