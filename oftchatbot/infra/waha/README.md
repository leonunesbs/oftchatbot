# WAHA ARM64 (Docker)

This project uses WAHA in a dedicated local stack for Apple Silicon / ARM64.

## 1) Pull image

```bash
pnpm waha:pull
```

## 2) Initialize WAHA credentials

Run from project root:

```bash
pnpm waha:init
```

This command generates `infra/waha/.env`.
For access credentials and API key, use the project root `.env` variables:
- `WAHA_API_KEY`
- `WAHA_DASHBOARD_USERNAME`
- `WAHA_DASHBOARD_PASSWORD`
- `WHATSAPP_SWAGGER_USERNAME`
- `WHATSAPP_SWAGGER_PASSWORD`
(`docker-compose` overrides these values at runtime).

## 3) Start WAHA

```bash
pnpm waha:up
```

Open dashboard at `http://localhost:3000/dashboard`.

## 4) Authenticate session

1. Go to sessions and start the `default` session.
2. Wait for `SCAN_QR`.
3. Scan with WhatsApp mobile app.
4. Wait until status is `WORKING`.

## 5) Test API

Use your API key from root `.env` (`WAHA_API_KEY`):

```bash
curl -X POST "http://localhost:3000/api/sendText" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: <WAHA_API_KEY>" \
  -d '{
    "chatId": "5511999999999@c.us",
    "text": "Hi there!",
    "session": "default"
  }'
```

## Useful commands

- `pnpm waha:logs` - stream WAHA logs
- `pnpm waha:down` - stop stack
