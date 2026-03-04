import type { APIRoute } from "astro";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { advanceSession, type SessionAdvanceInput } from "@/lib/live-session/store";

export const prerender = false;

function normalizePin(pin: unknown) {
  if (typeof pin !== "string") return null;
  const normalized = pin.trim();
  if (!/^\d{4}$/.test(normalized)) return null;
  return normalized;
}

function normalizeAction(action: unknown): SessionAdvanceInput["action"] | null {
  if (
    action === "previous" ||
    action === "next" ||
    action === "cant-see" ||
    action === "can-see-all" ||
    action === "finish"
  ) {
    return action;
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "live-session:advance",
    maxRequests: 180,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let payload: {
    pin?: unknown;
    ownerToken?: unknown;
    action?: unknown;
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
  const action = normalizeAction(payload.action);
  const ownerToken = typeof payload.ownerToken === "string" ? payload.ownerToken : null;

  if (!pin || !ownerToken || !action) {
    return new Response(JSON.stringify({ error: "Missing or invalid payload fields" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const session = advanceSession({
    pin,
    ownerToken,
    action,
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

