const PARALLEL_ROUTE_ORIGIN_QUERY_KEY = "from";

export { PARALLEL_ROUTE_ORIGIN_QUERY_KEY };

export function appendParallelRouteOrigin(href: string, originHref: string) {
  const normalizedOrigin = normalizeRelativeHref(originHref);
  if (!normalizedOrigin) {
    return href;
  }

  const [pathWithQuery, hash = ""] = href.split("#");
  const [pathname = "", query = ""] = (pathWithQuery ?? "").split("?");
  const params = new URLSearchParams(query);
  params.set(PARALLEL_ROUTE_ORIGIN_QUERY_KEY, normalizedOrigin);
  const nextQuery = params.toString();
  const nextHash = hash ? `#${hash}` : "";
  return nextQuery ? `${pathname}?${nextQuery}${nextHash}` : `${pathname}${nextHash}`;
}

export function resolveParallelRouteBackHref(
  originHref: string | null | undefined,
  fallbackHref: string,
) {
  const normalizedOrigin = normalizeRelativeHref(originHref);
  if (normalizedOrigin) {
    return normalizedOrigin;
  }

  const normalizedFallback = normalizeRelativeHref(fallbackHref);
  return normalizedFallback ?? fallbackHref;
}

function normalizeRelativeHref(value: string | null | undefined) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.startsWith("//")) {
    return null;
  }

  // Avoid protocol-based redirects and keep navigation inside app routes.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    return null;
  }

  if (!raw.startsWith("/")) {
    return null;
  }

  return raw;
}
