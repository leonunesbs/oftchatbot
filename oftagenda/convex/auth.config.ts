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

function resolveClerkIssuerDomain() {
  const candidates = [
    process.env.CLERK_FRONTEND_API_URL,
    process.env.CLERK_ISSUER_URL,
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const normalized = normalizeIssuerUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  throw new Error(
    "Clerk issuer domain não configurado. Defina CLERK_FRONTEND_API_URL (ex.: https://clerk.seudominio.com).",
  );
}

export default {
  providers: [
    {
      domain: resolveClerkIssuerDomain(),
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
