export const funnelStages = [
  "primeiro-contato",
  "qualificacao-clinica",
  "consulta-agendada",
  "consulta-realizada",
  "proposta-procedimento-cirurgia",
  "procedimento-cirurgia-agendado",
  "convertido",
  "nao-convertido",
] as const;

export type FunnelStage = (typeof funnelStages)[number];

export const funnelStageLabels: Record<FunnelStage, string> = {
  "primeiro-contato": "Primeiro contato",
  "qualificacao-clinica": "Qualificação clínica",
  "consulta-agendada": "Consulta agendada",
  "consulta-realizada": "Consulta realizada",
  "proposta-procedimento-cirurgia": "Proposta de procedimento/cirurgia",
  "procedimento-cirurgia-agendado": "Procedimento/cirurgia agendado",
  convertido: "Convertido",
  "nao-convertido": "Não convertido",
};

const funnelStageSet = new Set<string>(funnelStages);

const legacyFunnelStageMap: Record<string, FunnelStage> = {
  "novo-lead": "primeiro-contato",
  triagem: "qualificacao-clinica",
  confirmado: "consulta-agendada",
  "pos-consulta": "consulta-realizada",
  perdido: "nao-convertido",
};

export function normalizeFunnelStage(value: string | null | undefined): FunnelStage {
  if (!value) {
    return "primeiro-contato";
  }

  if (funnelStageSet.has(value)) {
    return value as FunnelStage;
  }

  return legacyFunnelStageMap[value] ?? "primeiro-contato";
}

export type ContactProfile = {
  chatId: string;
  contactName: string;
  phoneNumber: string;
  funnelStage: FunnelStage;
  notes: string;
  updatedAt: string;
};
