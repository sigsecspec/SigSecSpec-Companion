# Security Companion — Web Push Setup

This project is served statically from `docs/`. To use Web Push locally or on a custom host, run the minimal API server included here.

## Local demo

1. Open a terminal in `docs/` and install dependencies:

```bash
npm install
```

2. Start the local API server (serves static files and push endpoints):

```bash
npm run start
```

- Server: http://localhost:8787
- Static: serves `docs/` (index at `/index.html`)
- Endpoints:
  - GET `/api/vapidPublicKey` → returns public VAPID key
  - POST `/api/subscribe` → save subscription
  - POST `/api/send-test` → broadcast a test notification

3. In your browser, open `http://localhost:8787/index.html`.

4. Go to `Profile` → tap Notifications → Enable → Test.

Notes:
- For HTTPS on production, set env vars `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` and host the API where your site is served.
- GitHub Pages cannot run server endpoints; use the local server for testing push or deploy the API separately.
