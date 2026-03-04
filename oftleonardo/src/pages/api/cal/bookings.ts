import type { APIRoute } from "astro";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { CalApiError, createBooking, listEventTypes } from "@/lib/cal/client";

export const prerender = false;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeError(error: unknown) {
  if (error instanceof CalApiError) {
    if (error.status >= 400 && error.status < 500) {
      return {
        status: error.status,
        message: "Não foi possível concluir o agendamento online.",
      };
    }

    return {
      status: 502,
      message: "Serviço de agendamento indisponível no momento.",
    };
  }

  return {
    status: 500,
    message: "Erro interno ao criar agendamento.",
  };
}

function parseOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isIsoDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
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

export const POST: APIRoute = async ({ request }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "cal:bookings",
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Payload inválido. Envie JSON válido.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (!body || typeof body !== "object") {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Payload inválido.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const { citySlug, start, name, email, phoneNumber, timeZone } = body as Record<string, unknown>;

  if (typeof citySlug !== "string" || !citySlug.trim()) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "citySlug é obrigatório.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (typeof start !== "string" || !isIsoDateTime(start)) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "start deve estar em formato ISO 8601.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (typeof name !== "string" || name.trim().length < 3) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Informe um nome válido.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Informe um e-mail válido.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (typeof phoneNumber !== "string" || phoneNumber.trim().length < 8) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Informe um telefone válido.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    const eventTypes = await listEventTypes();
    const eventType = eventTypes.find((currentEventType) => currentEventType.slug === citySlug);

    if (!eventType) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "Tipo de consulta não encontrado para este local.",
        }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    const booking = await createBooking({
      eventTypeId: eventType.id,
      start,
      attendee: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        timeZone:
          typeof timeZone === "string" && timeZone.trim()
            ? timeZone.trim()
            : "America/Fortaleza",
        phoneNumber: parseOptionalString(phoneNumber),
        language: "pt-BR",
      },
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
          booking,
        },
      }),
      { status: 201, headers: JSON_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: normalized.message,
      }),
      { status: normalized.status, headers: JSON_HEADERS }
    );
  }
};
