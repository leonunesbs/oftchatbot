const IP_HEADER_KEYS = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"] as const;

function normalizeIpCandidate(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") {
    return null;
  }

  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    return trimmed.slice(1, trimmed.indexOf("]"));
  }

  // IPv4 with port, e.g. 203.0.113.10:54321
  if (trimmed.includes(".") && trimmed.includes(":")) {
    return trimmed.split(":")[0];
  }

  return trimmed;
}

export function extractClientIp(request: Request) {
  for (const headerKey of IP_HEADER_KEYS) {
    const headerValue = request.headers.get(headerKey);
    if (!headerValue) continue;

    const firstEntry = headerValue
      .split(",")
      .map((entry) => entry.trim())
      .find(Boolean);

    if (!firstEntry) continue;

    const ip = normalizeIpCandidate(firstEntry);
    if (ip) return ip;
  }

  return null;
}

export function isPublicIp(ip: string) {
  if (!ip) return false;

  const normalized = ip.toLowerCase();
  if (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "0.0.0.0"
  ) {
    return false;
  }

  if (normalized.includes(":")) {
    return !(
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  const ipv4Match = normalized.match(
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
  );
  if (!ipv4Match) return false;

  const first = Number(ipv4Match[1]);
  const second = Number(ipv4Match[2]);

  if (first === 10) return false;
  if (first === 127) return false;
  if (first === 169 && second === 254) return false;
  if (first === 172 && second >= 16 && second <= 31) return false;
  if (first === 192 && second === 168) return false;
  if (first === 100 && second >= 64 && second <= 127) return false;

  return true;
}
