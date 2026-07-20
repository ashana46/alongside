# Alongside worker

Cloudflare Worker acting as a thin proxy so the Anthropic API key never ships in the app.

## Endpoints

- `POST /steps` — body `{ "taskTitle": string, "targetStepCount"?: number }` → `{ "steps": string[] }`
- `GET /health` — `{ "ok": true }`

## Local dev

```bash
npm install
cp .dev.vars.example .dev.vars   # add your ANTHROPIC_API_KEY
npm run dev
```

Runs on `http://localhost:8787` by default. Point the app at it via `EXPO_PUBLIC_WORKER_URL`.

## Deploy

```bash
wrangler secret put ANTHROPIC_API_KEY
npm run deploy
```

## Privacy

The worker does not log or persist task titles or generated steps. Only event names, latency, and HTTP status codes are logged.
