# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow roles

- **Dev Thinker** — leonunesbs (the user): defines requirements, plans, reviews, decides direction.
- **Dev Coder** — Claude: implements what is planned, asks for clarification when needed, never makes architectural decisions unilaterally.

After completing any task, always ask: **"Quer fazer commit e push?"**

## Repository structure

This is a pnpm monorepo (`oftcore`) with two packages:

- **`oftagenda/`** — Ophthalmology scheduling app. Next.js 16 App Router + Convex + Clerk + Stripe. Runs on port 3001 by default.
- **`oftleonardo/`** — Doctor's personal/marketing site. Astro 5 + React + Tailwind CSS v4. Runs on port 4331 by default. Integrates with Cal.com for booking.

## Commands

Run from the monorepo root (`/Users/leonunesbs/Documents/Github/oftcore.nosync`):

```bash
pnpm dev                  # dev both apps (Next.js web only + Astro)
pnpm dev:all:full         # dev both apps including Convex backend
pnpm dev:agenda           # only oftagenda (Next.js only, no Convex)
pnpm dev:agenda:full      # only oftagenda + Convex dev
pnpm dev:leonardo         # only oftleonardo
pnpm build                # build both packages
pnpm lint                 # lint both packages (oxlint)
pnpm type-check           # type-check both packages
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

## oftagenda architecture

### Core concept
"Book first, details later." Patients confirm a slot with minimal info; optional triage is collected afterward at `/detalhes`.

### Tech stack
- **Next.js 16** App Router, React 19, TypeScript, Tailwind v4, shadcn/ui
- **Convex** — real-time database and backend (queries/mutations in `convex/`)
- **Clerk** — authentication; roles stored in `publicMetadata.role` (`"member"` | `"admin"`)
- **Stripe** — payments (webhook at `/api/stripe/webhook`)
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
`event_types`, `availabilities`, `availability_overrides`, `reservations`, `payments`, `stripe_webhook_events`, `patients`, `appointments`, `appointment_details`, `appointment_events`

### Admin role guard
Admin access is gated by `requireAdmin()` from `src/lib/access.ts`, which reads `publicMetadata.role` from Clerk. In Convex functions, `convex/admin.ts` re-reads the role from JWT claims.

### Convex client patterns
- Server components: use `getConvexHttpClient()` (unauthenticated) or `getAuthenticatedConvexHttpClient()` (requires Clerk JWT template named `convex`)
- Client components: use the `ConvexClientProvider` wrapper and `useQuery`/`useMutation` hooks from `convex/react`

### Environment variables (oftagenda)
Required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`
Optional: `CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `CLERK_FRONTEND_API_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Build auto-deploys Convex when `CONVEX_DEPLOY_KEY` is set.

## oftleonardo architecture

Astro 5 static site (SSR via `@astrojs/vercel` adapter). React islands for interactive components. Booking via iframe embed of oftagenda (`/embed/agendar`). Live session feature in `src/lib/live-session/` and `src/pages/api/live-session/`. Rate limiting in `src/lib/api/rate-limit.ts`.

## Commit conventions

Conventional commits enforced via commitlint + husky (`@commitlint/config-conventional`). Pre-commit runs lint-staged (oxlint + oxfmt on JS/TS files).

## Linting / formatting

Uses **oxlint** (not ESLint) and **oxfmt** (not Prettier). Config in `oftagenda/.oxlintrc.json` and `.oxfmtrc.json`.
