import type { AuthConfig } from "convex/server";

function normalizeIssuerUrls(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return [];
  }

  // Support accidental values like `https:/domain.com` by normalizing to `https://domain.com`.
  const normalizedProtocol = trimmed.replace(/^https?:\/(?!\/)/i, "https://");
  const withProtocol = /^https?:\/\//i.test(normalizedProtocol)
    ? normalizedProtocol
    : `https://${normalizedProtocol}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname) {
      return [];
    }
    const host = parsed.port ? `${parsed.hostname}:${parsed.port}` : parsed.hostname;
    const origin = `${parsed.protocol}//${host}`;
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    const urls = new Set<string>([origin, `${origin}/`]);
    if (normalizedPath && normalizedPath !== "/") {
      const withPath = `${origin}${normalizedPath}`;
      urls.add(withPath);
      urls.add(`${withPath}/`);
    }
    return [...urls];
  } catch {
    return [];
  }
}

function resolveClerkDomain() {
  const candidates = [
    process.env.CLERK_FRONTEND_API_URL,
    process.env.CLERK_ISSUER_URL,
    process.env.CLERK_JWT_ISSUER_DOMAIN,
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
    process.env.NEXT_PUBLIC_CLERK_ISSUER_URL,
  ];
  const uniqueDomains = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    for (const normalized of normalizeIssuerUrls(candidate)) {
      uniqueDomains.add(normalized);
    }
  }
  if (uniqueDomains.size === 0) {
    throw new Error(
      "Dominio emissor do Clerk nao configurado. Defina CLERK_FRONTEND_API_URL (ou CLERK_ISSUER_URL/CLERK_JWT_ISSUER_DOMAIN/NEXT_PUBLIC_CLERK_FRONTEND_API_URL/NEXT_PUBLIC_CLERK_ISSUER_URL) com um dominio valido (ex.: https://clerk.seudominio.com).",
    );
  }
  return [...uniqueDomains];
}

export default {
  providers: resolveClerkDomain().map((domain) => ({
    domain,
    applicationID: "convex",
  })),
} satisfies AuthConfig;
