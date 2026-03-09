import { siteConfig } from "./site";

export type ClusterTopic = {
  slug: string;
  title: string;
  description: string;
  href: string;
  intent: "informational" | "transactional";
  condition?: string;
  procedure?: string;
};

export const clusterTopics: ClusterTopic[] = [
  {
    slug: "acuidade-visual",
    title: "Teste de acuidade visual online",
    description:
      "Triagem visual com Snellen e Tumbling E para avaliação inicial da acuidade visual.",
    href: "/acuidade-visual",
    intent: "informational",
    condition: "Deficiência Visual",
    procedure: "Consulta Oftalmológica",
  },
  {
    slug: "tela-amsler",
    title: "Tela de Amsler online",
    description:
      "Triagem de distorção visual central e sinais de alerta para doenças da mácula.",
    href: "/tela-de-amsler",
    intent: "informational",
    condition: "Metamorfopsia",
    procedure: "Avaliação de Retina",
  },
  {
    slug: "agendamento",
    title: "Agendamento online de consulta oftalmológica",
    description:
      "Fluxo para escolher cidade, data e horário de consulta com confirmação digital.",
    href: siteConfig.partnerApps.oftagenda,
    intent: "transactional",
    procedure: "Consulta Oftalmológica",
  },
  {
    slug: "retinopatia-diabetica",
    title: "Retinopatia Diabética: o que é, sintomas e tratamento",
    description:
      "Saiba como o diabetes afeta a visão e quais os tratamentos para retinopatia diabética.",
    href: "/conteudos/retinopatia-diabetica",
    intent: "informational",
    condition: "Retinopatia Diabética",
    procedure: "Tratamento de Retina",
  },
  {
    slug: "degeneracao-macular",
    title: "Degeneração Macular (DMRI): o que é, sintomas e tratamento",
    description:
      "Entenda a DMRI, principal causa de perda de visão central em pessoas acima de 50 anos.",
    href: "/conteudos/degeneracao-macular",
    intent: "informational",
    condition: "Degeneração Macular Relacionada à Idade",
    procedure: "Tratamento de Retina",
  },
  {
    slug: "coriorretinopatia-serosa",
    title: "Coriorretinopatia Serosa Central: o que é e como tratar",
    description:
      "Saiba por que a serosa central causa visão embaçada e como é feito o tratamento.",
    href: "/conteudos/coriorretinopatia-serosa",
    intent: "informational",
    condition: "Coriorretinopatia Serosa Central",
    procedure: "Tratamento de Retina",
  },
  {
    slug: "ceratocone",
    title: "Ceratocone: o que é, sintomas e tratamento",
    description:
      "Entenda o ceratocone, a deformidade da córnea que causa visão distorcida e embaçada.",
    href: "/conteudos/ceratocone",
    intent: "informational",
    condition: "Ceratocone",
    procedure: "Crosslinking de Córnea",
  },
  {
    slug: "glaucoma",
    title: "Glaucoma: o que é, sintomas e tratamento",
    description:
      "Saiba por que o glaucoma é o ladrão silencioso da visão e como prevenir a perda visual.",
    href: "/conteudos/glaucoma",
    intent: "informational",
    condition: "Glaucoma",
    procedure: "Tratamento de Glaucoma",
  },
  {
    slug: "catarata",
    title: "Catarata: o que é, sintomas e tratamento",
    description:
      "Entenda a catarata, seus sintomas e como a cirurgia pode restaurar a visão.",
    href: "/conteudos/catarata",
    intent: "informational",
    condition: "Catarata",
    procedure: "Cirurgia de Catarata",
  },
  {
    slug: "estrabismo",
    title: "Estrabismo: o que é, sintomas e tratamento",
    description:
      "Saiba o que causa o desalinhamento dos olhos e como tratar em crianças e adultos.",
    href: "/conteudos/estrabismo",
    intent: "informational",
    condition: "Estrabismo",
    procedure: "Tratamento de Estrabismo",
  },
];

