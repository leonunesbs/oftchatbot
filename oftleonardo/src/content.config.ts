import { defineCollection, z } from "astro:content";
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
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    ),
    relatedSlugs: z.array(z.string()),
  }),
});

export const collections = { conteudos };
