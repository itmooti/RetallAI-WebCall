# Retell AI Web Widget

Two approaches to embed a Retell AI voice/chat agent on any website.

## Quick Start

### Option 1: Web Call SDK (`/web-call-sdk/`)
**Real-time voice conversation directly in the browser.**

1. Set up the **n8n webhook proxy** (see [Backend Proxy](#backend-proxy-n8n-webhook) below)
2. Open `web-call-sdk/index.html` in your browser (or host on GitHub Pages)
3. Enter your n8n **Webhook URL** and **Agent ID**
4. Click "Connect to Agent"
5. Click the mic button to start talking

> Your API key stays safely on the server — the frontend only receives a temporary access token.

**Features:**
- One-click voice call with your Retell agent
- Real-time audio visualizer (agent talking indicator)
- Live transcript display
- Session-based config (refreshes clear it)
- Clean, dark UI — ready to embed or customise

---

### Option 2: Widget Embed (`/widget-embed/`)
**Retell's official embeddable widget — single `<script>` tag.**

This is the simplest approach. Retell provides a production-ready widget that supports:
- **Chat Widget** — text-based conversation with a chat agent
- **Callback Widget** — collects user info and triggers a phone call

Just copy the `<script>` tag into any page's `<head>` and replace the placeholder values.
See `widget-embed/index.html` for the code snippets and setup instructions.

> ✅ **Production-safe** — uses Retell public keys, no API secret exposed.

---

## Which should I use?

| Feature | Web Call SDK | Widget Embed |
|---|---|---|
| Voice in browser | ✅ Real-time | ❌ (callback = phone call) |
| Text chat | ❌ | ✅ Chat widget |
| Backend needed | Yes (n8n webhook) | No |
| Setup complexity | Medium | Very simple |
| Customisable UI | Fully custom | Limited (colour, title) |
| Production-safe | Yes (via n8n proxy) | Yes (public key) |

---

## Hosting on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source: Deploy from branch → `main` / `root`**
3. Your pages will be live at:
   - `https://yourusername.github.io/repo-name/web-call-sdk/`
   - `https://yourusername.github.io/repo-name/widget-embed/`

---

## Backend Proxy (n8n Webhook)

The Web Call SDK uses an **n8n webhook** as a backend proxy to keep your Retell API key server-side.

**n8n Workflow: "Retell API Proxy"** (3 nodes):
1. **Webhook** — `POST /retell-proxy` receives `{ agent_id }` from the frontend
2. **HTTP Request** — Calls `https://api.retellai.com/v2/create-web-call` with your API key
3. **Respond to Webhook** — Returns `{ access_token }` to the frontend

**Setup:**
1. Open the "Retell API Proxy" workflow in n8n
2. In the "Create Web Call" node, replace `YOUR_RETELL_API_KEY` with your actual Retell API key
3. Activate the workflow
4. Copy the production webhook URL and paste it into the Web Call SDK setup panel

---

## Resources

- [Retell AI Dashboard](https://dashboard.retellai.com)
- [Web Call SDK Docs](https://docs.retellai.com/deploy/web-call)
- [Widget Embed Docs](https://docs.retellai.com/deploy/chat-widget)
- [retell-client-js-sdk (npm)](https://www.npmjs.com/package/retell-client-js-sdk)
- [Retell API Reference](https://docs.retellai.com/api-references/create-web-call)

---

Built by [Awesomate](https://awesomate.com.au)
