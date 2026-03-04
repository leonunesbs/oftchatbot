import type { APIRoute } from "astro";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { joinSession } from "@/lib/live-session/store";

export const prerender = false;

function normalizePin(pin: unknown) {
  if (typeof pin !== "string") return null;
  const normalized = pin.trim();
  if (!/^\d{4}$/.test(normalized)) return null;
  return normalized;
}

export const POST: APIRoute = async ({ request }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "live-session:join",
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let payload: { pin?: unknown };

  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const pin = normalizePin(payload.pin);
  if (!pin) {
    return new Response(JSON.stringify({ error: "PIN must have 4 digits" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const result = joinSession(pin);
  if (!result) {
    return new Response(JSON.stringify({ error: "Session not found or expired" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

