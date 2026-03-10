# CLAUDE.md — Retell AI Web Widget

## Project Overview

This is a static-site toolkit for embedding Retell AI voice and chat agents on any website. Built for **Awesomate** (Mooti Pty Ltd) to deploy AI voice agents for small-medium business clients without requiring complex infrastructure.

The project is designed to be hosted on **GitHub Pages** — no build step, no bundler, just static HTML/CSS/JS files.

## Architecture

```
retell-web-widget/
├── web-call-sdk/          # Real-time voice-in-browser via Retell Web Client SDK
│   ├── index.html         # Full-featured UI: config panel, orb visualizer, transcript
│   └── embed-snippet.html # Minimal floating button (FAB) to paste into any site
├── widget-embed/          # Retell's official embeddable widget (script tag)
│   └── index.html         # Reference page with chat + callback widget snippets
└── README.md
```

### Two Approaches

1. **Web Call SDK** (`/web-call-sdk/`) — Uses `retell-client-js-sdk` via CDN (jsDelivr). Creates a real-time WebRTC voice call in the browser. Uses an **n8n webhook proxy** to call the Retell REST API server-side — the API key never reaches the browser.

2. **Widget Embed** (`/widget-embed/`) — Uses Retell's official `retell-widget.js` from `dashboard.retellai.com`. Supports chat widget (text) and callback widget (triggers phone call). Uses Retell public keys — safe for production. Single `<script>` tag, no SDK needed.

## Key Technical Details

### Retell Web Call Flow
1. Frontend POSTs `{ agent_id }` to the **n8n webhook proxy**
2. n8n calls `https://api.retellai.com/v2/create-web-call` with the API key (stored server-side) → returns `access_token`
3. Frontend receives the `access_token` and instantiates `RetellWebClient` from the SDK
4. Call `retellWebClient.startCall({ accessToken })` to begin the WebRTC session
5. Listen to events: `call_started`, `call_ended`, `agent_start_talking`, `agent_stop_talking`, `update` (transcript), `error`
6. Call `retellWebClient.stopCall()` to end

### SDK Version
- `retell-client-js-sdk@2.0.7` loaded via `https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.7/dist/index.umd.min.js`
- UMD bundle exposes `window.RetellWebClient`
- Server-side SDK (`retell-sdk` on npm) is NOT used — this is frontend only

### API Authentication
- REST API uses `Authorization: Bearer <API_KEY>` header
- Widget embed uses Retell **public keys** (different from API keys — created in Dashboard → Keys → Add Key → Public Key, scoped to a domain)

## Styling & Design Decisions

- **Fonts**: DM Sans (body) + Space Mono (labels, code) via Google Fonts
- **Theme**: Dark mode (`#0a0a0f` background) for the Web Call SDK UI; light mode for the widget reference page
- **Accent colour**: `#6c5ce7` (purple) — matches Awesomate brand palette
- **Status colours**: Green `#00b894` (connected/live), Red `#e17055` (error/end)
- **No build tools** — pure vanilla HTML/CSS/JS, no React, no Tailwind, no bundler
- **No external dependencies** beyond the Retell SDK CDN and Google Fonts

## Configuration

Users enter their settings at runtime via the setup panel (stored in `sessionStorage`, cleared on tab close). The two required values are:

- `Webhook Proxy URL` — The n8n webhook URL for the "Retell API Proxy" workflow (e.g. `https://your-n8n.example.com/webhook/retell-proxy`)
- `RETELL_AGENT_ID` — The voice agent ID from the agent settings page (format: `agent_xxxxxxxxxxxxxxxx`)

The Retell API key is stored in the n8n workflow's HTTP Request node and never exposed to the browser.

For the widget embed, users need:
- `RETELL_PUBLIC_KEY` — Created in Dashboard → Keys → Public Key (format: `key_xxxxxxxxxxxxxxxx`)
- `RETELL_AGENT_ID` — Chat Agent ID or Voice Agent ID depending on widget mode

## Backend Proxy (n8n)

The n8n workflow **"Retell API Proxy"** (ID: `pKxMMp4gXIWrodoV`) acts as a backend proxy:

1. **Webhook node** — `POST /retell-proxy` receives `{ agent_id }` from the frontend
2. **HTTP Request node** — Calls Retell API with the API key (stored in the node config)
3. **Respond to Webhook node** — Returns `{ access_token, call_id }` with CORS headers

### Setup
1. Open the workflow in n8n and replace `YOUR_RETELL_API_KEY` in the "Create Web Call" node
2. Activate the workflow
3. Use the production webhook URL in the frontend

### Future Enhancements
- Lock CORS `Access-Control-Allow-Origin` to your specific domain
- Add reCAPTCHA or rate limiting to prevent abuse

## Development Notes

- All files are self-contained single-file HTML — no imports between them
- The embed snippet (`embed-snippet.html`) is designed to be copy-pasted as a fragment, not loaded as a standalone page (though it works standalone for testing)
- The transcript display shows the last 5 utterances (Retell SDK limitation to keep payloads small)
- The SDK uses WebRTC under the hood — requires HTTPS in production (localhost is fine for testing)
- Access tokens expire after 30 seconds if `startCall()` isn't called

## Useful Links

- [Retell Web Call Docs](https://docs.retellai.com/deploy/web-call)
- [Retell Widget Docs](https://docs.retellai.com/deploy/chat-widget)
- [Create Web Call API](https://docs.retellai.com/api-references/create-web-call)
- [retell-client-js-sdk npm](https://www.npmjs.com/package/retell-client-js-sdk)
- [retell-sdk (server-side) npm](https://www.npmjs.com/package/retell-sdk)
- [Retell Dashboard](https://dashboard.retellai.com)
