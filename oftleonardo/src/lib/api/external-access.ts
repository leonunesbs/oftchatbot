const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function parseOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseHeaderList(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function originsFromHost(host: string) {
  return [`https://${host}`, `http://${host}`];
}

function getAllowedOrigins(requestUrl: URL) {
  const configured = (import.meta.env.ALLOWED_API_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .flatMap((origin) => {
      // Support both fully-qualified URLs and bare hostnames.
      const parsed = parseOrigin(origin);
      if (parsed) return [parsed];
      return originsFromHost(origin);
    });

  return new Set([requestUrl.origin, ...originsFromHost(requestUrl.host), ...configured]);
}

function getRequestHostOrigins(request: Request) {
  const xForwardedHosts = parseHeaderList(request.headers.get("x-forwarded-host"));
  const host = request.headers.get("host");
  const hosts = new Set([...xForwardedHosts, ...(host ? [host] : [])]);

  return Array.from(hosts).flatMap((value) => originsFromHost(value));
}

export function blockExternalAccess(request: Request, requestUrl: URL) {
  const allowedOrigins = new Set([
    ...getAllowedOrigins(requestUrl),
    ...getRequestHostOrigins(request),
  ]);

  const requestOrigin = parseOrigin(request.headers.get("origin"));
  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    return null;
  }

  const refererOrigin = parseOrigin(request.headers.get("referer"));
  if (refererOrigin && allowedOrigins.has(refererOrigin)) {
    return null;
  }

  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: JSON_HEADERS,
  });
}
