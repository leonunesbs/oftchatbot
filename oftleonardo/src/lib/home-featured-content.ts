import type { CollectionEntry } from "astro:content";

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

const MAX_HOME = 6;

export function pickFeaturedArticles(
  articles: CollectionEntry<"conteudos">[],
): CollectionEntry<"conteudos">[] {
  const bySlug = new Map(articles.map((a) => [a.id, a]));
  const ordered: CollectionEntry<"conteudos">[] = [];

  for (const slug of HOME_CONTENT_FEATURED_SLUGS) {
    const entry = bySlug.get(slug);
    if (entry) ordered.push(entry);
    if (ordered.length >= MAX_HOME) return ordered;
  }

  const rest = articles
    .filter((a) => !ordered.some((o) => o.id === a.id))
    .sort((a, b) => a.data.condition.localeCompare(b.data.condition, "pt-BR"));

  for (const a of rest) {
    ordered.push(a);
    if (ordered.length >= MAX_HOME) break;
  }

  return ordered;
}
