import type { APIRoute } from "astro";
import { resolveGeoCity } from "@/lib/geo";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const city = await resolveGeoCity({
    request,
    cookies,
  });

  return new Response(JSON.stringify(city), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      vary: "cookie, x-forwarded-for, x-real-ip, cf-connecting-ip",
    },
  });
};
