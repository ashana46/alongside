# Alongside

A calm task companion for women with ADHD.

See [`PRD.md`](./PRD.md) for the product spec.

## Repo layout

- **`app/`** — Expo (React Native + TypeScript) client. Runs on iOS + Android via Expo Go.
- **`worker/`** — Cloudflare Worker acting as the AI proxy so the API key never ships in the app.

## Running the app locally (Expo Go)

```bash
cd app
npm install
npm run start
```

Scan the QR code with the Expo Go app on your phone. Works on both iOS and Android.

## Running the worker locally

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars   # then fill in ANTHROPIC_API_KEY
npm run dev
```

The Expo app defaults to `http://localhost:8787` for the worker in dev.

## Design principles

See PRD §5. Short version: never imply failure, one thing at a time, presence over surveillance.
