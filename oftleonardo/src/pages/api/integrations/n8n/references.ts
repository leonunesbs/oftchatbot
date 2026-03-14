import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { clusterTopics } from "@/config/semantic-clusters";
import { siteConfig } from "@/config/site";

export const prerender = false;

function parseBooleanParam(value: string | null, defaultValue: boolean) {
  if (value === null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return defaultValue;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const includeHomeFaq = parseBooleanParam(url.searchParams.get("includeHomeFaq"), true);
    const includeArticleFaq = parseBooleanParam(
      url.searchParams.get("includeArticleFaq"),
      true,
    );
    const includeArticleBody = parseBooleanParam(
      url.searchParams.get("includeArticleBody"),
      false,
    );

    const articles = await getCollection("conteudos");
    const informationalTools = clusterTopics.filter((topic) => topic.intent === "informational");
    const schedulingTopic = clusterTopics.find((topic) => topic.intent === "transactional");

    const contentHubArticles = articles.map((article) => ({
      slug: article.id,
      url: new URL(`/conteudos/${article.id}`, siteConfig.canonical).href,
      title: article.data.title,
      description: article.data.description,
      condition: article.data.condition,
      procedure: article.data.procedure,
      readingTime: article.data.readingTime,
      keywords: article.data.keywords,
      relatedSlugs: article.data.relatedSlugs,
      faq: includeArticleFaq ? article.data.faq : [],
      bodyMarkdown: includeArticleBody ? article.body : undefined,
    }));

    const response = {
      ok: true,
      integration: "oftleonardo-n8n-references",
      source: {
        site: siteConfig.canonical,
        faqPath: "/#faq",
        contentHubPath: "/conteudos",
        apiPath: "/api/integrations/n8n/references",
      },
      options: {
        includeHomeFaq,
        includeArticleFaq,
        includeArticleBody,
      },
      references: {
        faq: includeHomeFaq ? siteConfig.faq : [],
        contentHub: {
          totalArticles: contentHubArticles.length,
          totalTools: informationalTools.length,
          tools: informationalTools.map((tool) => ({
            slug: tool.slug,
            title: tool.title,
            description: tool.description,
            condition: tool.condition,
            procedure: tool.procedure,
            href: tool.href,
            url: new URL(tool.href, siteConfig.canonical).href,
          })),
          scheduling:
            schedulingTopic === undefined
              ? null
              : {
                  slug: schedulingTopic.slug,
                  title: schedulingTopic.title,
                  description: schedulingTopic.description,
                  href: schedulingTopic.href,
                  url: new URL(schedulingTopic.href, siteConfig.canonical).href,
                },
          articles: contentHubArticles,
        },
      },
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Falha ao gerar referências do FAQ e do Hub de Conteúdos.";

    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
};
