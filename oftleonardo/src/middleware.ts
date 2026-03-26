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

const siteUnderConstruction =
  process.env.NEXT_PUBLIC_SITE_UNDER_CONSTRUCTION === "true";

function renderUnderConstructionPage(appName: string, returnUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName} | Em construcao</title>
    <style>
      :root {
        color-scheme: dark;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at top, #1f2937 0%, #0b0b0f 60%, #050506 100%);
        color: #f5f5f5;
        font-family: Inter, "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 1.25rem;
      }
      .card {
        width: min(42rem, 100%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(18, 18, 24, 0.86);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      }
      .eyebrow {
        display: inline-flex;
        padding: 0.375rem 0.75rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 0.8rem;
        color: #e5e7eb;
      }
      h1 {
        margin: 1rem 0 0.75rem;
        font-size: clamp(1.6rem, 2.2vw, 2.2rem);
        line-height: 1.2;
      }
      p {
        margin: 0;
        color: #d1d5db;
        line-height: 1.65;
      }
      .actions {
        margin-top: 1.5rem;
      }
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-decoration: none;
        color: #fafafa;
        background: rgba(255, 255, 255, 0.08);
        font-weight: 600;
        padding: 0.7rem 1rem;
      }
      a:hover {
        background: rgba(255, 255, 255, 0.14);
      }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="eyebrow">Aviso importante</span>
      <h1>${appName} esta em construcao</h1>
      <p>Estamos realizando ajustes finais para entregar uma experiencia melhor. Em breve, esta pagina estara disponivel novamente.</p>
      <div class="actions">
        <a href="${returnUrl}">Ir para a pagina inicial</a>
      </div>
    </main>
  </body>
</html>`;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const acceptsHtml =
    context.request.headers.get("accept")?.includes("text/html") ?? false;
  if (siteUnderConstruction && acceptsHtml) {
    return new Response(
      renderUnderConstructionPage(
        "Leonardo Nunes Oftalmologista",
        "https://oftleonardo.com.br",
      ),
      {
        status: 503,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, no-cache, must-revalidate",
          pragma: "no-cache",
          "Content-Security-Policy": cspDirectives,
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "X-Content-Type-Options": "nosniff",
          "Permissions-Policy":
            "camera=(), microphone=(), geolocation=(), usb=()",
        },
      },
    );
  }

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
