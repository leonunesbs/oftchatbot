import type { LumiIntent } from "@/lib/lumi/types";

type IntentPattern = {
  priority: number;
  keywords: string[];
  synonyms: string[];
  typos: string[];
};

export const intentPatterns: Record<LumiIntent, IntentPattern> = {
  urgent_symptoms: {
    priority: 100,
    keywords: ["dor intensa", "perda de visao", "trauma ocular", "flashs", "sombras", "quimico no olho"],
    synonyms: ["dor forte no olho", "visao sumiu", "batida no olho", "clarões", "cortina preta", "produto no olho"],
    typos: ["perca de visao", "flashes", "sombrar", "quimico olho"],
  },
  talk_to_human: {
    priority: 90,
    keywords: ["atendente", "humano", "pessoa", "falar com alguem"],
    synonyms: ["quero atendimento humano", "me chama no whatsapp", "quero falar com secretaria"],
    typos: ["atendete", "humnao"],
  },
  schedule_appointment: {
    priority: 80,
    keywords: ["agendar", "consulta", "marcar consulta", "horario"],
    synonyms: ["quero marcar", "tem vaga", "agendamento"],
    typos: ["agenda", "agendarr", "consuta"],
  },
  reschedule: {
    priority: 70,
    keywords: ["reagendar", "mudar horario", "trocar data"],
    synonyms: ["alterar consulta", "remarcar"],
    typos: ["reagenda", "reagendr"],
  },
  cancel: {
    priority: 70,
    keywords: ["cancelar", "desmarcar"],
    synonyms: ["nao vou poder ir", "quero cancelar consulta"],
    typos: ["canselar", "cancelr"],
  },
  ask_pricing: {
    priority: 60,
    keywords: ["preco", "valor", "quanto custa"],
    synonyms: ["orçamento", "quanto fica", "valor da consulta"],
    typos: ["preço", "valr", "orcamento"],
  },
  ask_insurance: {
    priority: 60,
    keywords: ["convenio", "plano", "aceita convenio"],
    synonyms: ["atende unimed", "atende hapvida", "plano de saude"],
    typos: ["convênio", "convenioo", "plnao"],
  },
  ask_hours: {
    priority: 50,
    keywords: ["horario", "funcionamento", "abre", "fecha"],
    synonyms: ["que horas atende", "horas de atendimento"],
    typos: ["horairo", "funcionameto"],
  },
  ask_location: {
    priority: 50,
    keywords: ["endereco", "local", "onde fica", "localizacao"],
    synonyms: ["como chegar", "mapa", "fica onde"],
    typos: ["enderco", "localizacão", "ond fica"],
  },
  ask_services: {
    priority: 45,
    keywords: ["catarata", "retina", "glaucoma", "olho seco", "exame", "consulta oftalmologica"],
    synonyms: ["dmri", "descolamento", "pressao ocular", "fundoscopia"],
    typos: ["catarataa", "retna", "glaocoma", "olho ceco"],
  },
  greeting: {
    priority: 20,
    keywords: ["oi", "ola", "bom dia", "boa tarde", "boa noite"],
    synonyms: ["e ai", "opa", "olá", "eae", "olaaa"],
    typos: ["oii", "olaa", "bo dia", "boa tade", "boa noit"],
  },
  fallback: {
    priority: 0,
    keywords: [],
    synonyms: [],
    typos: [],
  },
};

export function normalizeForMatch(input: string) {
  return input
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}
