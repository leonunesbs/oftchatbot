# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow roles

- **Dev Thinker** — leonunesbs (the user): defines requirements, plans, reviews, decides direction.
- **Dev Coder** — Claude: implements what is planned, asks for clarification when needed, never makes architectural decisions unilaterally.

## Writing quality (user-visible text)

- Any text shown to end users (UI labels, messages, dialogs, chatbot replies, notifications, emails, docs shown in product) must be reviewed before delivery.
- Always correct grammar, spelling, punctuation, and accentuation according to standard Brazilian Portuguese when the text is in PT-BR.
- Prefer clear, natural wording and avoid awkward literal translations.
- For oftleonardo references, use "Dr Leonardo" or "Leonardo Nunes". Avoid "Dr Leonardo Nunes".

After completing any task, ask: **"Quer fazer commit e push?"** only when commit/push has not already been executed in the current request. If commit and push were already completed, confirm success and do not repeat the question.

## Commit/push strategy

- **Single source of truth:** version control for product code happens **only** in `oftcore`. Implement changes under `oftagenda/`, `oftleonardo/`, `oftchatbot/`, `psiqdenise/`, then commit and push from the monorepo root.
- **Do not** push commits directly to the standalone GitHub repos (`leonunesbs/oftagenda`, `oftleonardo`, `oftchatbot`, `psiqdenise`). Those remotes are updated by CI, not by manual pushes from a separate clone.
- Always run commit/push from the `oftcore` monorepo root.
- Do not run commit/push directly inside package directories as if they were separate repositories.
- Propagate package changes through `.github/workflows/split-repositories.yml`, which calls `scripts/split-package-push.sh` to run `git subtree split` and push each package repo after pushes to `main`.

## Design decisions

### oftleonardo booking flow
Single booking flow: all CTAs (Hero, Header desktop/mobile) point to `/agendamento-online`, which embeds the oftagenda form via iframe. WhatsAppModal was removed from Hero and Header — it remains only in CTAFinal, Cities, ScheduleConsultationSection, and ResultsStep. Do not add a second booking CTA alongside the primary "Agendar Consulta" link.

### oftagenda booking form
No auto-selection of default date/time. The user must explicitly choose location → date → time. The `useEffect` auto-selects were removed from `booking-form.tsx`.

### Destructive actions in UI
Any destructive user action (delete, clear, reset, irreversible state change) must require explicit confirmation via shadcn/radix `AlertDialog` in the UI. Do not rely on `window.confirm` for product flows.

## Repository structure

This is a pnpm monorepo (`oftcore`). **Primary products:** `oftagenda`, `oftleonardo`, and `psiqdenise` (they drive root `pnpm dev`, `pnpm build`, `pnpm lint`, and `pnpm type-check`). **`oftchatbot/`** is kept as an **MVP** (WhatsApp/Lumi); validate it explicitly with `pnpm build:chatbot`, `pnpm lint:chatbot`, and `pnpm type-check:chatbot` from the monorepo root when you change it.

- **`oftagenda/`** — Ophthalmology scheduling app. Next.js 16 App Router + Convex + Clerk + pagamentos online (**Stripe** e **Pagar.me** em paralelo, escolha por deploy). Runs on port 3001 by default.
- **`oftleonardo/`** — Doctor's personal/marketing site. Astro 5 + React + Tailwind CSS v4. Runs on port 4331 by default. Booking via iframe embed of oftagenda (`/agendamento-online` → `/embed/agendar`).
- **`psiqdenise/`** — Psychologist site (Astro). Same stack family as oftleonardo; uses its own content and port (see `psiqdenise/package.json`).
- **`oftchatbot/`** — Clinic chatbot app (Next.js). Runs on port 3030 by default. MVP scope; not part of the default monorepo build/lint/type-check pipeline.

### Monorepo split & deploy strategy

On every push to `main`, `.github/workflows/split-repositories.yml` runs parallel jobs that use `git subtree split` to push each package to its own standalone repo:

| Package | Target repo | Secret required |
|---------|-------------|-----------------|
| `oftagenda/` | `leonunesbs/oftagenda` | `OFTAGENDA_REPO_TOKEN` |
| `oftleonardo/` | `leonunesbs/oftleonardo` | `OFTLEONARDO_REPO_TOKEN` |
| `oftchatbot/` | `leonunesbs/oftchatbot` | `OFTCHATBOT_REPO_TOKEN` |
| `psiqdenise/` | `leonunesbs/psiqdenise` | `PSIQDENISE_REPO_TOKEN` |

Each job also generates a standalone `pnpm-workspace.yaml` and `pnpm-lock.yaml` inside the package directory (extracted from the root workspace config) so the target repo can install dependencies independently. Deployments (Vercel, Convex, etc.) are triggered from those individual repos, not from this monorepo.

**Implications for development:**
- Keep commit/push operations centralized in `oftcore`; do not push commits directly to the standalone repos — the split workflow is the propagation path after each push to `main`.
- `pnpm-workspace.yaml` and `pnpm-lock.yaml` inside each package directory are auto-generated by CI; do not edit them manually.

## Commands

Run from the monorepo root (`/Users/leonunesbs/Documents/Github/oftcore.nosync`):

```bash
pnpm dev                  # dev oftagenda + oftleonardo + psiqdenise (parallel)
pnpm dev:all:full         # same three packages (full dev scripts per package)
pnpm dev:with-chatbot     # dev + oftchatbot (MVP) alongside the three above
pnpm dev:all:full:with-chatbot   # full dev scripts including oftchatbot
pnpm dev:agenda           # only oftagenda (Next.js only, no Convex)
pnpm dev:agenda:full      # only oftagenda + Convex dev
pnpm dev:leonardo         # only oftleonardo
pnpm dev:psiqdenise       # only psiqdenise
pnpm dev:chatbot          # only oftchatbot
pnpm build                # build oftagenda + oftleonardo + psiqdenise
pnpm build:chatbot        # build oftchatbot only (MVP)
pnpm lint                 # lint oftagenda + oftleonardo + psiqdenise
pnpm lint:chatbot         # lint oftchatbot only
pnpm type-check           # type-check oftagenda + oftleonardo + psiqdenise
pnpm type-check:chatbot   # type-check oftchatbot only
```

From `oftagenda/`:

```bash
pnpm dev              # starts both Next.js + Convex via scripts/dev-safe.mjs
pnpm dev:web          # Next.js only
pnpm dev:convex       # Convex backend only
pnpm lint             # oxlint --type-aware
pnpm lint:fix         # oxlint --fix --type-aware
pnpm format           # oxfmt --write
pnpm type-check       # next typegen && tsc --noEmit
```

From `oftchatbot/`:

```bash
pnpm dev              # start chatbot app on port 3030
pnpm test             # run Lumi dialog tests
pnpm test:lumi        # run node test suite for Lumi scenarios
pnpm waha:up          # start WAHA stack (Docker)
pnpm waha:down        # stop WAHA stack
pnpm waha:logs        # tail WAHA logs
pnpm type-check       # next typegen && tsc --noEmit
pnpm lint             # oxlint --type-aware
pnpm format           # oxfmt --write
```

## oftagenda architecture

### Core concept
"Book first, details later." Patients confirm a slot with minimal info; optional triage is collected afterward at `/detalhes`.

### Tech stack
- **Next.js 16** App Router, React 19, TypeScript, Tailwind v4, shadcn/ui
- **Convex** — real-time database and backend (queries/mutations in `convex/`)
- **Clerk** — authentication; roles stored in `publicMetadata.role` (`"member"` | `"admin"`)
- **Stripe** — checkout `POST /api/stripe/checkout`; webhook `POST /api/stripe/webhook` (assinatura `stripe-signature`).
- **Pagar.me** — SDK [`pagarmeapisdklib`](https://github.com/pagarme/pagarme-nodejs-sdk); checkout hospedado via pedido + `payment_method: checkout`; rota `POST /api/pagarme/checkout` (mesmo contrato de resposta que Stripe: `{ ok: true, url }`); webhook `POST /api/pagarme/webhook`. Provedor ativo no cliente: `NEXT_PUBLIC_PAYMENT_PROVIDER` (`stripe` \| `pagarme`).
- **Zod v4** — validation; `zod/v4` import path required (not `zod`)

### Key directories
- `convex/` — Convex schema + server functions (`admin.ts`, `appointments.ts`, `patients.ts`, `history.ts`, `triage.ts`)
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — shared React components; `src/components/ui/` — shadcn/ui primitives
- `src/lib/access.ts` — auth guards (`requireAdmin`, `requireMember`, `requireConfirmedBooking`)
- `src/lib/convex-server.ts` — server-side Convex HTTP client helpers
- `src/lib/booking-bootstrap.ts` — server-side data preloading for booking flow
- `src/domain/booking/` — booking domain state and Zod schemas

### Route structure
| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/agendar` | Booking flow (parallel route `@resumo` shows summary intercept) |
| `/agendar/resumo` | Booking summary (also intercepted as modal) |
| `/detalhes` | Optional post-booking triage |
| `/dashboard` | Patient dashboard (parallel routes `@admin` / `@patient`) |
| `/dashboard/admin/*` | Admin panel (requires `role: admin`) |
| `/embed/agendar` | Embeddable booking widget |
| `/status` | Connectivity diagnostics |

### Convex schema tables
`event_types`, `availabilities`, `availability_overrides`, `reservations`, `payments` (inclui `provider` opcional `stripe` \| `pagarme`, `lastPagarmeEventId`), `stripe_webhook_events`, `pagarme_webhook_events`, `patients`, `appointments`, `appointment_details`, `appointment_events`

### Admin role guard
Admin access is gated by `requireAdmin()` from `src/lib/access.ts`, which reads `publicMetadata.role` from Clerk. In Convex functions, `convex/admin.ts` re-reads the role from JWT claims.

### Convex client patterns
- Server components: use `getConvexHttpClient()` (unauthenticated) or `getAuthenticatedConvexHttpClient()` (requires Clerk JWT template named `convex`)
- Client components: use the `ConvexClientProvider` wrapper and `useQuery`/`useMutation` hooks from `convex/react`

### Environment variables (oftagenda)
Required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`

**Pagamentos — escolha do provedor (build / deploy):**
- `NEXT_PUBLIC_PAYMENT_PROVIDER` — `stripe` (padrão) ou `pagarme`. Afeta checkout inicial, retentativa no painel e remarcação paga.

**Stripe (quando usado):**
- `STRIPE_SECRET_KEY` — obrigatória se `NEXT_PUBLIC_PAYMENT_PROVIDER=stripe` (ou padrão) e fluxo de checkout Stripe estiver ativo.
- `STRIPE_WEBHOOK_SECRET` — verificação do webhook Stripe.

**Pagar.me (quando `NEXT_PUBLIC_PAYMENT_PROVIDER=pagarme`):**
- `PAGARME_SECRET_KEY` — chave secreta (`sk_test_…` / `sk_…`); Basic Auth na API: usuário = secret, senha vazia (conforme [documentação de autenticação](https://docs.pagar.me/reference/autentica%C3%A7%C3%A3o-2)).
- `PAGARME_WEBHOOK_BASIC_USER` e `PAGARME_WEBHOOK_BASIC_PASSWORD` — opcionais; se **ambos** estiverem definidos, `POST /api/pagarme/webhook` exige o mesmo Basic Auth configurado no painel da Pagar.me. Se omitidos, o webhook não valida Basic (evitar em produção sem outra proteção).
- Opcionais para checkout (placeholder de customer / endereço de cobrança no pedido): `PAGARME_CHECKOUT_PLACEHOLDER_DOCUMENT` (CPF só dígitos), `PAGARME_CHECKOUT_BILLING_STREET`, `PAGARME_CHECKOUT_BILLING_NUMBER`, `PAGARME_CHECKOUT_BILLING_ZIP`, `PAGARME_CHECKOUT_BILLING_NEIGHBORHOOD`, `PAGARME_CHECKOUT_BILLING_CITY`, `PAGARME_CHECKOUT_BILLING_STATE`, `PAGARME_CHECKOUT_BILLING_LINE1`, `PAGARME_CHECKOUT_BILLING_LINE2`.

Outras opcionais: `CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `CLERK_FRONTEND_API_URL`.

Build auto-deploys Convex when `CONVEX_DEPLOY_KEY` is set.

### Webhooks de pagamento (oftagenda)
| Provedor | URL (HTTPS) | Observação |
|----------|-------------|------------|
| Stripe | `https://<domínio>/api/stripe/webhook` | Eventos já tratados no código (ex.: `checkout.session.completed`, expirado, falha, reembolso). |
| Pagar.me | `https://<domínio>/api/pagarme/webhook` | Cadastrar no painel: `order.paid`, `order.payment_failed`, `order.canceled`, `checkout.canceled`, `charge.refunded`. Lista geral: [eventos de webhook](https://docs.pagar.me/docs/webhooks). |

Rotas de webhook são públicas no middleware (`src/proxy.ts`) para não exigir sessão Clerk.

## oftleonardo architecture

Astro 5 static site (SSR via `@astrojs/vercel` adapter). React islands for interactive components. Booking via iframe embed of oftagenda (`/embed/agendar`). Live session feature in `src/lib/live-session/` and `src/pages/api/live-session/`. Rate limiting in `src/lib/api/rate-limit.ts`.

## oftchatbot architecture

**MVP:** The monorepo does not run oftchatbot in default `pnpm build` / `pnpm lint` / `pnpm type-check`; use the `:chatbot` scripts from the repo root when working on this package.

### Core concept
`oftchatbot` powers the clinic WhatsApp operation and CRM panel. **Lumi** is the deterministic assistant (source of truth for business decisions). **Fox** can optionally wrap Lumi replies via OpenAI for conversational tone while preserving the same deterministic decision.

### Tech stack
- **Next.js 16** App Router + React 19 + TypeScript
- **WAHA** integration for WhatsApp transport/events
- **SQLite** persistence for contact profile and Lumi session state
- **Oxlint/Oxfmt** for linting and formatting

### Key directories
- `src/lib/lumi/` — intent detection, entities extraction, guardrails, copy, state machine, telemetry, clinic config, Cal.com adapter
- `src/lib/contact-profile/store.ts` — SQLite store including `lumi_sessions` state
- `src/app/api/waha/webhook/route.ts` — webhook entrypoint that executes Lumi turn logic
- `src/app/api/book/route.ts` and `src/app/api/slots/route.ts` — booking and availability endpoints
- `src/app/page.tsx` — operator CRM inbox (conversations, messages, profile panel)
- `tests/lumi/dialogs.spec.ts` — dialog regression suite

### Behavioral guardrails
- Urgency signs (e.g. sudden vision loss, trauma, severe pain, chemical exposure) must trigger immediate emergency guidance and stop scheduling flow.
- Clinical conduct is educational only; do not diagnose, prescribe, or provide personalized medical treatment.
- Pricing, insurance, explicit human request, cancellation/reschedule, or repeated validation failures should trigger human handoff.

### Integration notes
- `POST /api/waha/webhook` processes eligible inbound messages and sends Lumi responses through WAHA.
- Optional Fox mode rewrites Lumi outbound text with OpenAI and falls back to Lumi text on failure/timeout.
- Cal.com integration is optional and can fall back to mock mode when credentials/event types are unavailable.
- Keep telemetry non-sensitive (`intent_detected`, `scheduling_started`, `scheduling_completed`, `urgent_triage_triggered`, `handoff_triggered`, `fallback_hit`).

### Environment variables (oftchatbot)
Core: WAHA environment keys used by chat/session endpoints and webhook.
Optional: `CALCOM_API_BASE_URL`, `CALCOM_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `STRIPE_PRIVATE_KEY`, `WAHA_WEBHOOK_URL`.

## Commit conventions

Conventional commits are enforced at the **monorepo root** via commitlint + Husky (`@commitlint/config-conventional`). Pre-commit runs lint-staged (oxlint + oxfmt for staged files under `oftagenda/` and `oftchatbot/`), then `pnpm type-check` and `pnpm type-check:chatbot`.

### Mandatory preflight before commit/push

- Before any commit in `oftagenda`, run `pnpm type-check` and fix all errors.
- Before any push in `oftagenda`, run `pnpm build` and only push if it succeeds.
- Never proceed with commit/push when type-check or build fails.
- If a CI/Vercel failure appears, reproduce locally first (`pnpm type-check` and `pnpm build`) before creating new commits.
- Keep Husky checks mandatory (non-optional): pre-commit runs `lint-staged`, then `pnpm type-check` and `pnpm type-check:chatbot`; pre-push runs `pnpm build` and `pnpm build:chatbot`.

## Linting / formatting

Uses **oxlint** (not ESLint) and **oxfmt** (not Prettier). Config in `oftagenda/.oxlintrc.json` and `.oxfmtrc.json`.
