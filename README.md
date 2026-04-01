# oftcore (monorepo)

Monorepo com os pacotes:

- **`oftagenda`** — agendamento (Next.js + Convex + Clerk)
- **`oftleonardo`** — site institucional (Astro)
- **`psiqdenise`** — site da psicóloga (Astro)
- **`oftbackend`** — API Node.js (Fastify) para responsabilidades server-side ligadas ao `oftagenda`; Convex continua como fonte de verdade
- **`oftchatbot`** — chatbot / CRM WhatsApp (Next.js, MVP)

## Estrutura

```text
.
├── oftagenda
├── oftleonardo
├── psiqdenise
├── oftbackend
├── oftchatbot
├── package.json
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js 20+
- pnpm 10+ (versão fixada em `package.json` → `packageManager`)

## Instalação

Na raiz do repositório:

```bash
pnpm install
```

## Comandos na raiz

### Desenvolvimento

| Comando | Descrição |
|--------|-----------|
| `pnpm dev` | `oftagenda` + `oftleonardo` + `psiqdenise` em paralelo (scripts `dev:web` de cada um) |
| `pnpm dev:all:full` | Mesmos três pacotes com scripts `dev` completos (ex.: `oftagenda` com Convex) |
| `pnpm dev:with-chatbot` | Três acima + `oftchatbot` |
| `pnpm dev:with-backend` | `oftagenda` + `oftleonardo` + `oftbackend` + `psiqdenise` |
| `pnpm dev:full-stack` | Inclui também `oftchatbot` |
| `pnpm dev:agenda` | Só `oftagenda` (Next.js; sem subir Convex sozinho pelo script do pacote) |
| `pnpm dev:agenda:full` | `oftagenda` com Next.js + Convex |
| `pnpm dev:leonardo` | Só `oftleonardo` |
| `pnpm dev:psiqdenise` | Só `psiqdenise` |
| `pnpm dev:chatbot` | Só `oftchatbot` |

### Build, lint e tipos

| Comando | Escopo |
|--------|--------|
| `pnpm build` | `oftagenda`, `oftleonardo`, `psiqdenise` |
| `pnpm build:agenda` / `build:leonardo` / `build:psiqdenise` / `build:chatbot` / `build:backend` | Pacote único |
| `pnpm lint` | `oftagenda`, `oftleonardo`, `psiqdenise` |
| `pnpm lint:chatbot` / `pnpm lint:backend` | Pacote único |
| `pnpm type-check` | `oftagenda`, `oftleonardo`, `psiqdenise` |
| `pnpm type-check:chatbot` / `pnpm type-check:backend` | Pacote único |
| `pnpm test:backend` | Testes do `oftbackend` |

### oftchatbot (MVP)

```bash
pnpm start:chatbot
pnpm test:chatbot
pnpm type-check:chatbot
pnpm lint:chatbot
pnpm lint:fix:chatbot
pnpm format:chatbot
pnpm format:check:chatbot
pnpm waha:init
pnpm waha:up
pnpm waha:down
pnpm waha:logs
pnpm waha:pull
pnpm waha:smoke
```

### Outros

```bash
pnpm preview:leonardo
```

## Portas usadas no desenvolvimento

| Pacote | URL padrão |
|--------|------------|
| `oftagenda` | `http://localhost:3001` (`NEXT_PORT` pode sobrescrever) |
| `oftleonardo` | `http://localhost:4331` (`PORT`) |
| `psiqdenise` | `http://localhost:4331` (`PORT`) — ao rodar `oftleonardo` e `psiqdenise` juntos, use `PORT` diferente em um deles |
| `oftchatbot` | `http://localhost:3030` |
| `oftbackend` | `http://localhost:8080` (`PORT` no `.env`) |
| Convex (dev, dentro do `oftagenda`) | porta padrão do CLI Convex |

## CI

- **`split-repositories.yml`** — após push em `main`, sincroniza pastas do monorepo com repositórios espelho (`git subtree split`), quando há mudanças nos paths correspondentes (ou em `workflow_dispatch`).
- **`oftbackend.yml`** — em PR/push que alteram `oftbackend/` (ou lock/workspace), executa lint, typecheck, Spectral no OpenAPI, testes e build do `oftbackend`.

## Deploy recomendado (ex.: Vercel)

Cada app costuma ser um projeto separado, com **Root Directory** apontando para a pasta do pacote (`oftagenda`, `oftleonardo`, `psiqdenise`, etc.).

- Variáveis de ambiente ficam isoladas por projeto (Clerk/Convex no `oftagenda`, analytics no site, etc.).
- Builds menores e rollback independente.

Sugestão de comandos:

- Install: `pnpm install --frozen-lockfile` (no monorepo) ou, no repositório espelho após split, conforme o lock gerado pelo CI.
- Build (exemplos): `pnpm --filter ./oftagenda build`, `pnpm --filter ./oftleonardo build`.

## Espelhamento no GitHub (subtree split)

O workflow **`.github/workflows/split-repositories.yml`** publica alterações no monorepo para repositórios standalone (deploys costumam apontar para esses repos).

| Pasta | Repositório de destino | Secret (PAT fine-grained recomendado) |
|-------|-------------------------|--------------------------------------|
| `oftagenda/` | `leonunesbs/oftagenda` | `OFTAGENDA_REPO_TOKEN` |
| `oftleonardo/` | `leonunesbs/oftleonardo` | `OFTLEONARDO_REPO_TOKEN` |
| `oftchatbot/` | `leonunesbs/oftchatbot` | `OFTCHATBOT_REPO_TOKEN` |
| `psiqdenise/` | `leonunesbs/psiqdenise` | `PSIQDENISE_REPO_TOKEN` |
| `oftbackend/` | `leonunesbs/oftbackend` | `OFTBACKEND_REPO_TOKEN` |

Permissão mínima típica do token: **Contents: Read and write** apenas no repositório de destino.

Fluxo:

1. Desenvolver e commitar **só no monorepo** `oftcore` (raiz).
2. Push para `main` dispara os jobs quando os paths mudam (ou use **Run workflow** manualmente).
3. Não dependa de push manual aos repos espelho para manter o histórico alinhado ao monorepo.

Detalhes adicionais: `CLAUDE.md` e regras em `.cursor/rules/`.

## SEO, mídia paga e mensuração

### Eventos padronizados (GTM/GA4/Meta/Ads)

- `select_city`
- `start_booking`
- `submit_booking`
- `booking_confirmed`

### Variáveis de ambiente sugeridas

- **oftagenda** (`NEXT_PUBLIC_*`): `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`
- **oftleonardo** (`PUBLIC_*`): `PUBLIC_GA4_ID`, `PUBLIC_GTM_ID`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_GOOGLE_ADS_ID`

### Governança (LGPD)

- Não enviar PII em eventos de analytics.
- Evitar query params com dados sensíveis em URLs públicas.
- Separar segredos por app e ambiente (dev/staging/prod).
