import { defineMiddleware } from "astro/middleware";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'self' https://agenda.oftleonardo.com.br https://*.oftleonardo.com.br",
  "child-src 'self' https://agenda.oftleonardo.com.br https://*.oftleonardo.com.br",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'report-sample' https:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("text/html")) {
    response.headers.set("Content-Security-Policy", cspDirectives);
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), usb=()",
    );
  }

  return response;
});
