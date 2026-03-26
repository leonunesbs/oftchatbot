import type { AstroCookies } from "astro";
import {
  getDefaultGeoCity,
  getSupportedCityBySlug,
  mapIpApiCityToSupportedCity,
} from "./city.ts";
import {
  GEO_CITY_COOKIE_MAX_AGE_SECONDS,
  GEO_CITY_COOKIE_NAME,
  GEO_REQUEST_TIMEOUT_MS,
} from "./constants.ts";
import { extractClientIp, isPublicIp } from "./ip.ts";

type ResolutionSource = "cookie" | "ip-api" | "fallback";

export interface GeoCityResolution {
  slug: string;
  name: string;
  state: string;
  source: ResolutionSource;
}

interface ResolveGeoCityOptions {
  request: Request;
  cookies: AstroCookies;
  timeoutMs?: number;
}

interface IpApiResponse {
  status: "success" | "fail";
  city?: string;
  region?: string;
  regionName?: string;
  countryCode?: string;
}

function setGeoCookie(cookies: AstroCookies, request: Request, citySlug: string) {
  const isSecure = new URL(request.url).protocol === "https:";
  cookies.set(GEO_CITY_COOKIE_NAME, citySlug, {
    path: "/",
    sameSite: "lax",
    secure: isSecure,
    httpOnly: false,
    maxAge: GEO_CITY_COOKIE_MAX_AGE_SECONDS,
  });
}

async function lookupIpApiCity(ip: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = new URL(`http://ip-api.com/json/${encodeURIComponent(ip)}`);
    endpoint.searchParams.set(
      "fields",
      "status,countryCode,region,regionName,city",
    );

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as IpApiResponse;
    if (data.status !== "success") return null;

    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function toResolution(
  source: ResolutionSource,
  citySlug: string | null | undefined,
): GeoCityResolution {
  const city = citySlug ? getSupportedCityBySlug(citySlug) : null;
  const finalCity = city ?? getDefaultGeoCity();

  return {
    slug: finalCity.slug,
    name: finalCity.name,
    state: finalCity.state,
    source: city ? source : "fallback",
  };
}

export async function resolveGeoCity({
  request,
  cookies,
  timeoutMs = GEO_REQUEST_TIMEOUT_MS,
}: ResolveGeoCityOptions): Promise<GeoCityResolution> {
  const cachedSlug = cookies.get(GEO_CITY_COOKIE_NAME)?.value;
  const cachedCity = getSupportedCityBySlug(cachedSlug);
  if (cachedCity) {
    return toResolution("cookie", cachedCity.slug);
  }

  const ip = extractClientIp(request);
  if (!ip || !isPublicIp(ip)) {
    const fallback = toResolution("fallback", null);
    setGeoCookie(cookies, request, fallback.slug);
    return fallback;
  }

  const ipApiData = await lookupIpApiCity(ip, timeoutMs);
  const mappedSlug = ipApiData
    ? mapIpApiCityToSupportedCity({
        city: ipApiData.city,
        region: ipApiData.region,
        regionName: ipApiData.regionName,
        countryCode: ipApiData.countryCode,
      })
    : null;

  const resolved = toResolution(mappedSlug ? "ip-api" : "fallback", mappedSlug);
  setGeoCookie(cookies, request, resolved.slug);
  return resolved;
}
