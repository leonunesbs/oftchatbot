import type { APIRoute } from "astro";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { createSession } from "@/lib/live-session/store";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const rateLimitResponse = applyRateLimit(request, {
    bucket: "live-session:create",
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { session, ownerToken } = createSession();

  return new Response(
    JSON.stringify({
      pin: session.pin,
      sessionId: session.sessionId,
      ownerToken,
      session,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
};

