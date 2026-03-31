# oftbackend

Backend service em Rust para extrair as responsabilidades server-side do `oftagenda`, mantendo Convex como source of truth.

## Stack

- Rust + Tokio + Axum
- Convex Rust client (`ConvexClient`)
- JWT validation (Clerk JWKS)
- Logging estruturado com `tracing`

## Setup local

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

2. Preencha as variáveis obrigatórias:

- `CONVEX_URL`
- `CLERK_ISSUER`
- `CLERK_AUDIENCE`
- `CLERK_JWKS_URL`
- `OFTBACKEND_INTERNAL_API_KEY`
- `OFTBACKEND_WEBHOOK_HMAC_SECRET`

3. Execute:

```bash
cargo run
```

Servidor padrão: `http://localhost:8080`

## Endpoints iniciais

- `GET /healthz`
- `GET /readyz`
- `GET /v1/auth/session`
- `POST /v1/booking/confirm`
- `POST /v1/payments/webhooks/stripe`
- `GET /v1/internal/metrics`

## Segurança

- JWT validado no backend (`iss`, `aud`, `exp`, `nbf`, assinatura).
- Endpoints internos protegidos por `x-api-key`.
- Webhooks com assinatura dedicada e validação temporal (`x-oft-timestamp`).

## Deploy

- Publicar `oftbackend` como serviço independente.
- Definir variáveis de ambiente no ambiente de deploy.
- Validar `healthz` e `readyz` após deploy.
- Executar dark launch e shadow mode antes do cutover.
