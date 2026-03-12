# Blueberry AI Button — Drop-in Snippet

This snippet adds a "TALK TO AI" button to any page on businessblueprint.com that connects visitors directly to the Blueberry AI voice agent (powered by Retell AI).

When clicked, the button starts a live voice call in the browser. While the call is active, coloured ripple rings animate outward from the button in the Amplify Your Business brand colours. Clicking the button again ends the call.

---

## What's in the snippet

The file `blueberry-button-snippet.html` contains three parts:

1. A `<style>` block — all styles are prefixed with `bb-ai-` so they won't clash with any existing styles on the Business Blueprint website.
2. The button HTML — a wrapper div, three invisible ring elements, and the button itself.
3. A `<script>` block — handles the voice call logic. No external libraries need to be installed; everything loads automatically at runtime.

---

## How to add it to the page

1. Open `blueberry-button-snippet.html` and copy everything between the two comment lines:

   `<!-- BLUEBERRY AI BUTTON — drop-in snippet for businessblueprint.com -->`
   and
   `<!-- END BLUEBERRY AI BUTTON -->`

2. Paste that block into the page template wherever you want the button to appear — for example, next to the existing "CLAIM YOUR FREE TICKET" button.

3. That's it. No npm install, no build step, no additional files needed.

---

## How the button behaves

- **Default state** — Blue outlined button reading "TALK TO AI 🤖"
- **After clicking** — Button dims and shows "Connecting…" while the call is being set up (usually 1–3 seconds)
- **Call active** — Button turns orange and reads "END CALL ✕". Coloured ripple rings animate outward continuously in orange, cyan, and green.
- **After ending** — Button returns to the default blue outlined state

---

## Button sizing and font

The button inherits `font-family` and `font-size` from whatever element it sits inside on the page, so it will automatically match the surrounding text style. If you need to adjust the size, change the `padding` and `font-size` values inside the `.bb-ai-btn` rule in the `<style>` block.

---

## Things to know before going live

- The page must be served over **HTTPS** for the browser microphone access to work. The Business Blueprint website already uses HTTPS so this is not an issue.
- The button requires an internet connection to reach the Retell API via the n8n proxy.
- The voice call uses the visitor's microphone. The browser will ask for microphone permission the first time someone clicks the button on a given device.
- If the n8n proxy URL or agent ID ever needs to change, update the two constants at the top of the `<script>` block:

  ```
  const AGENT_ID    = 'agent_55e0f16cb91903f641cca032a7';
  const WEBHOOK_URL = 'https://automations.vitalstats.app/webhook/retell-proxy';
  ```

---

## Live demo pages

Full standalone pages using this same button and agent are available here:

- Minimal branded button only: https://itmooti.github.io/RetallAI-WebCall/amplify-blueberry.html
- Full event hero page replica: https://itmooti.github.io/RetallAI-WebCall/amplify-hero.html
