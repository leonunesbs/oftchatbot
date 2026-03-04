import type { APIRoute } from "astro";
import { siteConfig } from "@/config/site";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { CalApiError, listEventTypes } from "@/lib/cal/client";

export const prerender = false;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function normalizePhoneNumber(raw: string) {
  return raw.replace(/\D/g, "");
}

function pickLocationLabel(eventType: Record<string, unknown>) {
  const locations = eventType.locations;
  if (!Array.isArray(locations)) return null;

  for (const location of locations) {
    if (!location || typeof location !== "object") continue;
    const current = location as Record<string, unknown>;
    const candidateFields = [
      current.label,
      current.address,
      current.value,
      current.name,
    ];

    for (const field of candidateFields) {
      if (typeof field === "string" && field.trim().length > 0) {
        return field.trim();
      }
    }
  }

  return null;
}

function getFallbackEventTypesFromSiteConfig() {
  return (siteConfig.cities ?? [])
    .map((city) => ({
      citySlug: city.slug,
      cityName: city.name,
      state: city.state ?? "",
      whatsappNumber: normalizePhoneNumber(city.whatsappNumber || siteConfig.phone),
      eventTypeSlug: city.calEventTypeSlug ?? city.slug,
      eventTypeId: null,
      eventTypeTitle: city.name,
      available: false,
    }))
    .filter((city) => city.citySlug.length > 0 && city.cityName.length > 0)
    .sort((a, b) => a.cityName.localeCompare(b.cityName, "pt-BR"));
}

function normalizeError(error: unknown) {
  if (error instanceof CalApiError) {
    if (error.status >= 400 && error.status < 500) {
      return {
        status: error.status,
        message: "Falha ao consultar dados de agendamento no Cal.com.",
      };
    }

    return {
      status: 502,
      message: "Serviço de agendamento indisponível no momento.",
    };
  }

  return {
    status: 500,
    message: "Erro interno ao carregar opções de agendamento.",
  };
}

export const GET: APIRoute = async ({ request }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "cal:event-types",
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const eventTypes = await listEventTypes();
    const whatsappNumber = normalizePhoneNumber(siteConfig.phone);
    const data = eventTypes
      .map((eventType) => {
        const eventTypeRecord = eventType as unknown as Record<string, unknown>;
        const cityName = pickLocationLabel(eventTypeRecord) || eventType.title;
        return {
          citySlug: eventType.slug,
          cityName,
          state: "",
          whatsappNumber,
          eventTypeSlug: eventType.slug,
          eventTypeId: eventType.id,
          eventTypeTitle: eventType.title ?? null,
          available: true,
        };
      })
      .sort((a, b) => a.cityName.localeCompare(b.cityName, "pt-BR"));

    return new Response(JSON.stringify({ status: "success", data }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    const fallbackData = getFallbackEventTypesFromSiteConfig();
    if (fallbackData.length > 0) {
      return new Response(
        JSON.stringify({
          status: "success",
          data: fallbackData,
          meta: {
            fallback: true,
          },
        }),
        {
          status: 200,
          headers: JSON_HEADERS,
        }
      );
    }

    const normalized = normalizeError(error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: normalized.message,
      }),
      {
        status: normalized.status,
        headers: JSON_HEADERS,
      }
    );
  }
};
