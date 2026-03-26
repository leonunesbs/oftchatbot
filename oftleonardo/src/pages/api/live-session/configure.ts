import type { APIRoute } from "astro";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { AVAILABLE_DISTANCES } from "@/components/visual-acuity/constants";
import { setSessionConfiguration } from "@/lib/live-session/store";

export const prerender = false;

function normalizePin(pin: unknown) {
  if (typeof pin !== "string") return null;
  const normalized = pin.trim();
  if (!/^\d{4}$/.test(normalized)) return null;
  return normalized;
}

function normalizeOptotypeMode(mode: unknown) {
  if (mode === "tumbling-e" || mode === "snellen-letters") return mode;
  return null;
}

function normalizeDistanceM(distanceM: unknown) {
  if (typeof distanceM !== "number" || Number.isNaN(distanceM)) return null;
  return AVAILABLE_DISTANCES.some((distance) => distance.meters === distanceM) ? distanceM : null;
}

export const POST: APIRoute = async ({ request }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "live-session:configure",
    maxRequests: 120,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let payload: {
    pin?: unknown;
    ownerToken?: unknown;
    optotypeMode?: unknown;
    distanceM?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const pin = normalizePin(payload.pin);
  const ownerToken = typeof payload.ownerToken === "string" ? payload.ownerToken : null;
  const optotypeMode = normalizeOptotypeMode(payload.optotypeMode);
  const hasDistanceField = payload.distanceM !== undefined;
  const distanceM = hasDistanceField ? normalizeDistanceM(payload.distanceM) : undefined;
  const hasMode = optotypeMode !== null;
  const hasDistance = distanceM !== undefined && distanceM !== null;

  if (!pin || !ownerToken || (!hasMode && !hasDistance) || (hasDistanceField && !hasDistance)) {
    return new Response(JSON.stringify({ error: "Missing or invalid payload fields" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const session = setSessionConfiguration({
    pin,
    ownerToken,
    mode: optotypeMode ?? undefined,
    distanceM: distanceM ?? undefined,
  });

  if (!session) {
    return new Response(JSON.stringify({ ok: true, session: null }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response(JSON.stringify({ ok: true, session }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
