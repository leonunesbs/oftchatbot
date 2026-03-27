/**
 * Contexto por rota para públicos GA4 (intenção + etapa do funil).
 * Usado em eventos e no disparo `audience_page_context`.
 */

export type AudiencePageContext = {
  funnel_stage: "top" | "warm" | "hot" | "tool" | "conversion_adjacent" | "legal";
  page_intent: "informational" | "transactional" | "tool_triage" | "legal";
  /** Tema clínico para segmentação (ex.: catarata, retina_diabetica). */
  content_theme?: string;
};

const DEFAULT_CONTEXT: AudiencePageContext = {
  funnel_stage: "warm",
  page_intent: "informational",
};

type Rule = {
  match: "exact" | "prefix";
  pattern: string;
  ctx: AudiencePageContext;
};

/** Ordem importa: primeira regra que casar vence (exceto `/conteudos/*`, tratado antes). */
const RULES: Rule[] = [
  {
    match: "exact",
    pattern: "/",
    ctx: { funnel_stage: "top", page_intent: "informational" },
  },
  {
    match: "exact",
    pattern: "/acuidade-visual",
    ctx: {
      funnel_stage: "tool",
      page_intent: "tool_triage",
      content_theme: "acuidade_visual",
    },
  },
  {
    match: "exact",
    pattern: "/tela-de-amsler",
    ctx: {
      funnel_stage: "tool",
      page_intent: "tool_triage",
      content_theme: "amsler",
    },
  },
  {
    match: "exact",
    pattern: "/agendamento-online",
    ctx: { funnel_stage: "hot", page_intent: "transactional" },
  },
  {
    match: "exact",
    pattern: "/agendamento-pendente",
    ctx: { funnel_stage: "conversion_adjacent", page_intent: "transactional" },
  },
  {
    match: "prefix",
    pattern: "/politica-de-privacidade",
    ctx: { funnel_stage: "legal", page_intent: "legal" },
  },
  {
    match: "prefix",
    pattern: "/termos-de-uso",
    ctx: { funnel_stage: "legal", page_intent: "legal" },
  },
];

/** Artigos: intenção de serviço / sintomas. */
const CONTENT_SLUG_THEMES: Record<string, string> = {
  catarata: "catarata",
  "retinopatia-diabetica": "retina_diabetica",
  "degeneracao-macular": "dmri",
  glaucoma: "glaucoma",
  ceratocone: "ceratocone",
  estrabismo: "estrabismo",
  "coriorretinopatia-serosa": "csr",
  presbiopia: "presbiopia",
};

/** Páginas de referência sobre exames (hub + um artigo por exame). */
const EXAM_REFERENCE_SLUGS = new Set([
  "exames-oftalmologicos",
  "biomicroscopia-lampada-de-fenda",
  "retinografia",
  "mapeamento-de-retina",
  "oct-tomografia-coerencia-optica",
  "angiografia-fluoresceinica",
  "campo-visual-perimetria",
  "topografia-corneana",
  "tomografia-de-cornea",
  "microscopia-especular",
]);

export function resolveAudiencePageContext(pathname: string): AudiencePageContext {
  let path = pathname || "/";
  if (path !== "/" && path.endsWith("/")) {
    path = path.replace(/\/$/, "") || "/";
  }

  if (path === "/conteudos") {
    return { funnel_stage: "warm", page_intent: "informational" };
  }
  if (path.startsWith("/conteudos/")) {
    const slug = path.slice("/conteudos/".length).split("/")[0] ?? "";
    const theme =
      CONTENT_SLUG_THEMES[slug] ?? (EXAM_REFERENCE_SLUGS.has(slug) ? "exames_referencia" : undefined);
    const hotSlugs = new Set(["catarata", "retinopatia-diabetica", "degeneracao-macular"]);
    const isHot = hotSlugs.has(slug);
    return {
      funnel_stage: isHot ? "hot" : "warm",
      page_intent: "informational",
      ...(theme ? { content_theme: theme } : {}),
    };
  }

  for (const rule of RULES) {
    if (rule.match === "exact" && path === rule.pattern) {
      return { ...rule.ctx };
    }
    if (rule.match === "prefix" && path.startsWith(rule.pattern)) {
      return { ...rule.ctx };
    }
  }

  return { ...DEFAULT_CONTEXT };
}
