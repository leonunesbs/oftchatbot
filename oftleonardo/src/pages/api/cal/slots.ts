import type { APIRoute } from "astro";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { CalApiError, getSlotsByEventTypeId, listEventTypes } from "@/lib/cal/client";

export const prerender = false;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const DEFAULT_TIME_ZONE = "America/Fortaleza";

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(startRaw: string | null, endRaw: string | null) {
  const now = new Date();
  const defaultStart = toIsoDate(now);
  const defaultEndDate = new Date(now);
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  const defaultEnd = toIsoDate(defaultEndDate);

  const start = startRaw ?? defaultStart;
  const end = endRaw ?? defaultEnd;

  return { start, end };
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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

function normalizeError(error: unknown) {
  if (error instanceof CalApiError) {
    if (error.status >= 400 && error.status < 500) {
      return {
        status: error.status,
        message: "Não foi possível consultar horários para este agendamento.",
      };
    }

    return {
      status: 502,
      message: "Serviço de agendamento indisponível no momento.",
    };
  }

  return {
    status: 500,
    message: "Erro interno ao consultar horários.",
  };
}

export const GET: APIRoute = async ({ request, url }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "cal:slots",
    maxRequests: 40,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const citySlug = url.searchParams.get("citySlug");
  if (!citySlug) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Parâmetro citySlug é obrigatório.",
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  const { start, end } = getDateRange(url.searchParams.get("start"), url.searchParams.get("end"));
  if (!isIsoDate(start) || !isIsoDate(end)) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Parâmetros start e end devem estar no formato YYYY-MM-DD.",
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  const timeZone = url.searchParams.get("timeZone") ?? DEFAULT_TIME_ZONE;

  try {
    const eventTypes = await listEventTypes();
    const eventType = eventTypes.find((currentEventType) => currentEventType.slug === citySlug);

    if (!eventType) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "Tipo de consulta não encontrado para este local.",
        }),
        {
          status: 404,
          headers: JSON_HEADERS,
        }
      );
    }

    const slotsByDate = await getSlotsByEventTypeId({
      eventTypeId: eventType.id,
      start,
      end,
      timeZone,
    });

    const eventTypeRecord = eventType as unknown as Record<string, unknown>;
    const cityName = pickLocationLabel(eventTypeRecord) || eventType.title;
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          citySlug: eventType.slug,
          cityName,
          eventTypeId: eventType.id,
          eventTypeSlug: eventType.slug,
          eventTypeTitle: eventType.title,
          timeZone,
          start,
          end,
          slotsByDate,
        },
      }),
      {
        status: 200,
        headers: JSON_HEADERS,
      }
    );
  } catch (error) {
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
