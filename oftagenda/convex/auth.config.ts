import type { AuthConfig } from "convex/server";

function normalizeIssuerUrl(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  // Support accidental values like `https:/domain.com` by normalizing to `https://domain.com`.
  const normalizedProtocol = trimmed.replace(/^https?:\/(?!\/)/i, "https://");
  const withProtocol = /^https?:\/\//i.test(normalizedProtocol)
    ? normalizedProtocol
    : `https://${normalizedProtocol}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname) {
      return null;
    }
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return null;
  }
}

function resolveClerkDomain() {
  const configuredDomain =
    process.env.CLERK_FRONTEND_API_URL ??
    process.env.CLERK_JWT_ISSUER_DOMAIN ??
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL;
  if (configuredDomain) {
    const normalized = normalizeIssuerUrl(configuredDomain);
    if (normalized) {
      return normalized;
    }
  }

  throw new Error(
    "Dominio emissor do Clerk nao configurado. Defina CLERK_FRONTEND_API_URL, CLERK_JWT_ISSUER_DOMAIN ou NEXT_PUBLIC_CLERK_FRONTEND_API_URL com um dominio valido (ex.: https://clerk.seudominio.com).",
  );
}

export default {
  providers: [
    {
      domain: resolveClerkDomain(),
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
