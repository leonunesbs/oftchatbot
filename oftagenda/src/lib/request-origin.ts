import { resolveSiteUrl } from "@/config/site";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function getFirstHeaderValue(value: string | null) {
  if (!value) {
    return null;
  }
  const firstValue = value.split(",")[0]?.trim();
  return firstValue && firstValue.length > 0 ? firstValue : null;
}

function getHostWithoutPort(host: string) {
  return host.replace(/:\d+$/, "").trim().toLowerCase();
}

function isLocalHost(host: string) {
  return LOCAL_HOSTS.has(getHostWithoutPort(host));
}

export function resolvePublicOrigin(request: Request) {
  const forwardedHost = getFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = getFirstHeaderValue(request.headers.get("host"));
  const candidateHost = forwardedHost ?? host;
  const forwardedProto = getFirstHeaderValue(request.headers.get("x-forwarded-proto"));

  if (candidateHost) {
    const protocol =
      forwardedProto && forwardedProto.length > 0
        ? forwardedProto
        : isLocalHost(candidateHost)
          ? "http"
          : "https";

    return `${protocol}://${candidateHost}`;
  }

  try {
    const requestOrigin = new URL(request.url).origin;
    const parsedRequestOrigin = new URL(requestOrigin);
    if (parsedRequestOrigin.protocol === "http:" && !isLocalHost(parsedRequestOrigin.hostname)) {
      parsedRequestOrigin.protocol = "https:";
      return parsedRequestOrigin.origin;
    }
    return requestOrigin;
  } catch {
    return resolveSiteUrl().origin;
  }
}
