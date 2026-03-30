import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const conteudos = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/conteudos" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.string(),
    condition: z.string(),
    procedure: z.string(),
    readingTime: z.string(),
    /** Data da última revisão do conteúdo (ISO `YYYY-MM-DD`). */
    lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Se verdadeiro, exibe o badge «Opinião» (conteúdo editorial); o padrão é artigo técnico revisado. */
    isOpinion: z.boolean().optional(),
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    ),
    relatedSlugs: z.array(z.string()),
    hubCategory: z.enum(["conditions", "exams", "refractive"]).default("conditions"),
  }),
});

export const collections = { conteudos };
