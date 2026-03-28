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
      "Teste rápido e gratuito no celular, com triagem orientativa da sua visão antes da consulta.",
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
];

