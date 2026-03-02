import { nonDiagnosticDisclaimer } from '@/lib/lumi/guardrails';
import type { AvailableDateOption, LumiCollectedData, SlotOption } from '@/lib/lumi/types';

export function introGreeting(name?: string) {
  if (name) {
    return `Oi, ${name}. Meu nome é Lumi da Clínica OFT Leonardo. Posso te ajudar com dúvidas gerais ou agendamento.`;
  }
  return 'Oi. Meu nome é Lumi da Clínica OFT Leonardo. Posso te ajudar com dúvidas gerais ou agendamento.';
}

export function askMissingField(field: keyof LumiCollectedData) {
  switch (field) {
    case 'fullName':
      return 'Perfeito. Para seguir, como você prefere ser chamado?';
    case 'phone':
      return 'Entendi. Só preciso do seu telefone com DDD para confirmar, pode me informar?';
    case 'email':
      return 'Se quiser receber confirmação por e-mail, pode me passar? (opcional)';
    case 'location':
      return 'Certo. Qual local você prefere para o atendimento?';
    case 'consultationType':
      return 'Ótimo. Qual tipo de consulta você procura (geral, catarata, retina, glaucoma, olho seco ou exames)?';
    case 'datePreference':
      return 'Perfeito. Se tiver preferência de turno (manhã, tarde ou noite), me fala que eu considero na busca dos horários.';
    default:
      return 'Certo. Pode me passar esse dado para eu continuar?';
  }
}

export function triageUrgentReply() {
  return 'Sinto muito que você esteja passando por isso. Pelos sinais que descreveu, a orientação é procurar pronto atendimento oftalmológico imediatamente. Se houve produto químico no olho, lave com água corrente por alguns minutos e vá ao atendimento sem demora.';
}

export function faqReply(topic: string, body: string) {
  return `${body}\n\n${nonDiagnosticDisclaimer()}\n\nSe notar piora súbita, dor intensa ou perda de visão, procure pronto atendimento.`;
}

export function faqStrategicReply(topic?: string) {
  if (topic === 'glaucoma') {
    return 'Você tem glaucoma ou alguém da sua família já recebeu esse diagnóstico? Se quiser, posso te mostrar horários para marcar uma consulta e avaliar isso com segurança.';
  }
  return 'Se quiser, já te mostro os próximos horários disponíveis para uma avaliação oftalmológica. Posso te enviar agora?';
}

export function handoffReply(reason: string) {
  return `Entendi. Para ${reason}, vou te encaminhar para nosso atendimento humano no WhatsApp agora: https://wa.me/5585999999999`;
}

export function slotOptionsReply(options: SlotOption[]) {
  const lines = options.slice(0, 4).map((slot, index) => `${index + 1}) ${slot.label}`);
  const changeDateOption = `${lines.length + 1}) Trocar data`;
  const changeEventOption = `${lines.length + 2}) Trocar evento (local de atendimento)`;
  return `Encontrei estes spots de horário:\n${lines.join('\n')}\n${changeDateOption}\n${changeEventOption}\n\nMe diz o número da opção que você prefere.`;
}

export function dateOptionsReply(options: AvailableDateOption[], eventTypeName?: string) {
  const lines = options.slice(0, 7).map((date, index) => `${index + 1}) ${date.label}`);
  const eventName = eventTypeName?.trim() || '[event type name]';
  const changeEventOption = `${lines.length + 1}) Selecionar outro evento (local de atendimento)`;
  return `Consultei o calendário e estes são os próximos dias em ${eventName} com agenda disponível (30 dias):\n${lines.join('\n')}\n${changeEventOption}\n\nMe diz o número da data que você prefere para eu te mostrar os horários.`;
}

export function confirmationReply(data: LumiCollectedData, selectedSlot?: SlotOption) {
  const summary = [
    `Nome: ${data.fullName ?? 'não informado'}`,
    `Telefone: ${data.phone ?? 'não informado'}`,
    `E-mail: ${data.email ?? 'não informado'}`,
    `Local: ${data.location ?? 'não informado'}`,
    `Tipo: ${data.consultationType ?? 'não informado'}`,
    `Preferência: ${data.datePreference?.raw ?? 'não informada'}`,
    selectedSlot ? `Horário: ${selectedSlot.label}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  return `Perfeito, organizei tudo aqui:\n${summary}\n\nPosso confirmar esse agendamento e já te enviar o link de pagamento?`;
}

export function bookingSuccessReply(protocol: string, paymentUrl?: string, phone?: string) {
  if (paymentUrl) {
    const contactSuffix = phone ? ` no número ${phone}` : '';
    return `Consulta pré-agendada com sucesso. Protocolo: ${protocol}.\n\nAqui está o link de pagamento (Stripe) gerado pelo Cal.com${contactSuffix}:\n${paymentUrl}\n\nSe precisar ajustar, fale com nosso time: https://wa.me/5585999999999`;
  }
  return `Consulta pré-agendada com sucesso. Protocolo: ${protocol}. O link de pagamento será enviado em seguida pelo nosso time. Se precisar ajustar, fale com nosso time: https://wa.me/5585999999999`;
}

export function fallbackReply() {
  return 'Entendi sua mensagem. Posso te ajudar com horários, local, dúvidas gerais de oftalmologia ou agendamento. Como prefere seguir?';
}
