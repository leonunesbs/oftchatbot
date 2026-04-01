import { normalizeForMatch } from "@/lib/lumi/patterns";

const forbiddenClinicalTerms = [
  "diagnostico",
  "prescrever",
  "prescricao",
  "laudo",
  "interpreta meu exame",
  "qual remedio",
  "que colirio tomar",
];

export function requiresClinicalGuardrail(rawText: string) {
  const text = normalizeForMatch(rawText);
  return forbiddenClinicalTerms.some((term) => text.includes(term));
}

export function guardrailReply() {
  return "Entendi sua dúvida. Eu não posso diagnosticar nem indicar tratamento por aqui. Posso te ajudar com agendamento ou te encaminhar para atendimento humano no WhatsApp.";
}

export function nonDiagnosticDisclaimer() {
  return "Esta orientação é educativa e não substitui consulta oftalmológica.";
}
