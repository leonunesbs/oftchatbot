import { getCollection, getEntry, type CollectionEntry } from "astro:content";

/** Ordem de prioridade para a vitrine na home (SEO + autoridade clínica). */
export const HOME_CONTENT_FEATURED_SLUGS = [
  "catarata",
  "retinopatia-diabetica",
  "glaucoma",
  "degeneracao-macular",
  "miopia",
  "exames-oftalmologicos",
  "oct-tomografia-coerencia-optica",
  "ceratocone",
] as const;

export const MAX_HOME_FEATURED_ARTICLES = 6;

export function pickFeaturedArticles(
  articles: CollectionEntry<"conteudos">[],
): CollectionEntry<"conteudos">[] {
  const bySlug = new Map(articles.map((a) => [a.id, a]));
  const ordered: CollectionEntry<"conteudos">[] = [];

  for (const slug of HOME_CONTENT_FEATURED_SLUGS) {
    const entry = bySlug.get(slug);
    if (entry) ordered.push(entry);
    if (ordered.length >= MAX_HOME_FEATURED_ARTICLES) return ordered;
  }

  const rest = articles
    .filter((a) => !ordered.some((o) => o.id === a.id))
    .sort((a, b) => a.data.condition.localeCompare(b.data.condition, "pt-BR"));

  for (const a of rest) {
    ordered.push(a);
    if (ordered.length >= MAX_HOME_FEATURED_ARTICLES) break;
  }

  return ordered;
}

/**
 * Carrega só os guias necessários à home via `getEntry`.
 * Só chama `getCollection` se faltarem entradas para completar a vitrine (fallback).
 */
export async function loadHomeConteudos(): Promise<{
  featuredContent: CollectionEntry<"conteudos">[];
  presbiopiaArticle: CollectionEntry<"conteudos"> | null;
}> {
  const preloadIds = [
    ...new Set<string>([...HOME_CONTENT_FEATURED_SLUGS, "presbiopia"]),
  ];
  const entries = await Promise.all(
    preloadIds.map((id) => getEntry("conteudos", id)),
  );
  let articles = entries.filter(
    (e): e is CollectionEntry<"conteudos"> => e != null,
  );

  const presbiopiaArticle = articles.find((a) => a.id === "presbiopia") ?? null;

  let featured = pickFeaturedArticles(articles);
  if (featured.length < MAX_HOME_FEATURED_ARTICLES) {
    const used = new Set(articles.map((a) => a.id));
    const rest = await getCollection(
      "conteudos",
      (e) => !used.has(e.id),
    );
    featured = pickFeaturedArticles([...articles, ...rest]);
  }

  return { featuredContent: featured, presbiopiaArticle };
}
