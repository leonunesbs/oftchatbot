import type {
  AvailableDateOption,
  LumiCollectedData,
  SlotOption,
} from "@/lib/lumi/types";

import type { AssistantMode } from "@/lib/assistants/types";
import { nonDiagnosticDisclaimer } from "@/lib/lumi/guardrails";

export function introGreeting(
  name?: string,
  assistant: AssistantMode = "lumi",
) {
  if (assistant === "fire") {
    return "Oi! Meu nome é Fire, da Clínica OFT Leonardo. Como posso te ajudar hoje?";
  }
  if (name) {
    return `Oi, ${name}. Meu nome é Lumi, assistente da Clínica OFT Leonardo. Posso te ajudar com dúvidas gerais ou agendamento.`;
  }
  return "Oi, meu nome é Lumi, assistente da Clínica OFT Leonardo. Posso te ajudar com dúvidas gerais ou agendamento.";
}

type AskMissingFieldOptions = {
  locationHint?: {
    ddd?: string;
    dddCity?: string;
    ipCity?: string;
  };
};

export function askMissingField(
  field: keyof LumiCollectedData,
  options?: AskMissingFieldOptions,
) {
  switch (field) {
    case "fullName":
      return "Perfeito. Para seguir, como você prefere ser chamado?";
    case "email":
      return "Se quiser receber confirmação por e-mail, pode me passar? (opcional)";
    case "location": {
      const hint = options?.locationHint;
      if (hint?.ddd === "85" && hint.dddCity === "Fortaleza") {
        return "Vejo que seu DDD e 85. E de Fortaleza que voce gostaria de receber sua consulta ou outro lugar?";
      }
      if (hint?.ddd && hint.dddCity) {
        return `Vejo que seu DDD e ${hint.ddd} (${hint.dddCity}). Prefere atendimento em ${hint.dddCity} ou em outro local?`;
      }
      if (hint?.ipCity) {
        return `Pelo seu acesso, parece que voce esta em ${hint.ipCity}. Quer atendimento em ${hint.ipCity} ou em outro local?`;
      }
      return "Certo. Qual local voce prefere para o atendimento?";
    }
    case "consultationType":
      return "Ótimo. Qual tipo de consulta você procura (geral, catarata, retina, glaucoma, olho seco ou exames)?";
    case "datePreference":
      return "Perfeito. Se tiver preferência de turno (manhã, tarde ou noite), me fala que eu considero na busca dos horários.";
    default:
      return "Certo. Pode me passar esse dado para eu continuar?";
  }
}

export function triageUrgentReply() {
  return "Sinto muito que você esteja passando por isso. Pelos sinais que descreveu, a orientação é procurar pronto atendimento oftalmológico imediatamente. Se houve produto químico no olho, lave com água corrente por alguns minutos e vá ao atendimento sem demora.";
}

export function faqReply(topic: string, body: string) {
  return `${body}\n\n${nonDiagnosticDisclaimer()}\n\nSe notar piora súbita, dor intensa ou perda de visão, procure pronto atendimento.`;
}

export function faqStrategicReply(
  topic?: string,
  assistant: AssistantMode = "lumi",
) {
  if (topic === "glaucoma") {
    if (assistant === "fire") {
      return "Se você quiser, eu posso te mostrar horários para uma avaliação com especialista, sem compromisso.";
    }
    return "Você tem glaucoma ou alguém da sua família já recebeu esse diagnóstico? Se quiser, posso te mostrar horários para marcar uma consulta e avaliar isso com segurança.";
  }
  return undefined;
}

export function handoffReply(reason: string) {
  return `Entendi. Para ${reason}, vou te encaminhar para nosso atendimento humano no WhatsApp agora: https://wa.me/5585999999999`;
}

export function slotOptionsReply(options: SlotOption[]) {
  const lines = options
    .slice(0, 4)
    .map((slot, index) => `${index + 1}) ${slot.label}`);
  const changeDateOption = `${lines.length + 1}) Trocar data`;
  const changeEventOption = `${lines.length + 2}) Trocar evento (local de atendimento)`;
  return `Encontrei estes spots de horário:\n${lines.join("\n")}\n${changeDateOption}\n${changeEventOption}\n\nMe diz o número da opção que você prefere.`;
}

export function dateOptionsReply(
  options: AvailableDateOption[],
  eventTypeName?: string,
) {
  const lines = options
    .slice(0, 7)
    .map((date, index) => `${index + 1}) ${date.label}`);
  const eventName = eventTypeName?.trim() || "[event type name]";
  const changeEventOption = `${lines.length + 1}) Selecionar outro evento (local de atendimento)`;
  return `Consultei o calendário e estes são os próximos dias em ${eventName} com agenda disponível (30 dias):\n${lines.join("\n")}\n${changeEventOption}\n\nMe diz o número da data que você prefere para eu te mostrar os horários.`;
}

export function confirmationReply(
  data: LumiCollectedData,
  selectedSlot?: SlotOption,
) {
  const summary = [
    `Nome: ${data.fullName ?? "não informado"}`,
    `Telefone: ${data.phone ?? "não informado"}`,
    `E-mail: ${data.email ?? "não informado"}`,
    `Local: ${data.location ?? "não informado"}`,
    `Tipo: ${data.consultationType ?? "não informado"}`,
    `Preferência: ${data.datePreference?.raw ?? "não informada"}`,
    selectedSlot ? `Horário: ${selectedSlot.label}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return `Perfeito, organizei tudo aqui:\n${summary}\n\nPosso confirmar esse agendamento e já te enviar o link para continuar na Minha Agenda?`;
}

export function bookingSuccessReply(paymentUrl?: string, phone?: string) {
  if (paymentUrl) {
    const contactSuffix = phone ? ` no número ${phone}` : "";
    return `Perfeito. Para confirmar o agendamento${contactSuffix}, finalize no link oficial:\n${paymentUrl}\n\nSe quiser alterar data, horário ou local, me avise por aqui ou fale com o time humano: https://wa.me/5585999999999`;
  }
  return "Perfeito. Em instantes te envio o link oficial para confirmar o agendamento.";
}

export function bookingStatusReply(input: {
  protocol?: string;
  paymentStatusText: string;
  bookingStatusText: string;
  paymentUrl?: string;
}) {
  const protocolText = input.protocol ? `\nProtocolo: ${input.protocol}` : "";
  const paymentLinkText = input.paymentUrl
    ? `\n\nSe quiser concluir agora, use este link de agendamento:\n${input.paymentUrl}`
    : "";

  return `Atualizei seu status agora.\n${protocolText}\nPagamento: ${input.paymentStatusText}\nAgendamento: ${input.bookingStatusText}${paymentLinkText}\n\nSe precisar, posso te ajudar a remarcar ou chamar nosso time humano.`;
}

export function fallbackReply(assistant: AssistantMode = "lumi") {
  if (assistant === "fire") {
    return "Obrigado por compartilhar isso. Posso te ajudar com orientações gerais, horários, localização da clínica e agendamento, do jeito que você preferir.";
  }
  return "Obrigado por compartilhar isso. Posso te ajudar com dúvidas gerais de oftalmologia, horários, local da clínica e agendamento, no seu ritmo.";
}
