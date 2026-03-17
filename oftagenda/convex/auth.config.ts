import type { AuthConfig } from "convex/server";

function normalizeIssuerUrl(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
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
  const configuredDomain = process.env.CLERK_FRONTEND_API_URL;
  if (configuredDomain) {
    const normalized = normalizeIssuerUrl(configuredDomain);
    if (normalized) {
      return normalized;
    }
  }

  throw new Error(
    "Dominio do Clerk nao configurado. Defina CLERK_FRONTEND_API_URL com um dominio valido (ex.: https://clerk.seudominio.com).",
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
