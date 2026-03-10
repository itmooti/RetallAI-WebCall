/**
 * Retell AI Voice Widget
 * Drop one <script> tag on any page to add a floating voice-call button.
 *
 * Usage:
 *   <script
 *     src="https://itmooti.github.io/RetallAI-WebCall/widget.js"
 *     data-webhook-url="https://your-n8n.example.com/webhook/retell-proxy"
 *     data-agent-id="agent_xxxxxxxxxxxxxxxx"
 *     data-title="Talk to our AI"
 *   ></script>
 *
 * Optional attributes:
 *   data-title        Panel heading (default: "Talk to our AI")
 *   data-position     "bottom-right" | "bottom-left" (default: "bottom-right")
 */
(function () {
  'use strict';

  // ── Config from script tag ──────────────────────────────────────────────────
  const script = document.currentScript;
  const WEBHOOK_URL = script?.dataset.webhookUrl;
  const AGENT_ID    = script?.dataset.agentId;
  const TITLE       = script?.dataset.title || 'Talk to our AI';
  const POSITION    = script?.dataset.position === 'bottom-left' ? 'left' : 'right';

  if (!WEBHOOK_URL || !AGENT_ID) {
    console.error('[RetellWidget] Missing data-webhook-url or data-agent-id on <script> tag.');
    return;
  }

  // ── Host element + Shadow DOM ───────────────────────────────────────────────
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;bottom:24px;${POSITION}:24px;z-index:2147483647;`;
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  // ── CSS (scoped inside Shadow DOM — zero risk of client-site conflicts) ─────
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host {
      --accent:       #6c5ce7;
      --accent-glow:  rgba(108,92,231,0.4);
      --green:        #00b894;
      --green-glow:   rgba(0,184,148,0.3);
      --red:          #e17055;
      --red-glow:     rgba(225,112,85,0.3);
      --bg:           #0d0d14;
      --surface:      #16161f;
      --border:       #2a2a3e;
      --text:         #e4e4ed;
      --muted:        #7a7a8e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Floating button ── */
    .fab {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: var(--accent);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px var(--accent-glow);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px var(--accent-glow); }
    .fab:active { transform: scale(0.92); }
    .fab svg { width: 24px; height: 24px; fill: #fff; }
    .fab .icon-close { display: none; }
    .fab.open .icon-mic   { display: none; }
    .fab.open .icon-close { display: block; }

    /* Pulse ring on fab when call is live */
    .fab.live::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px solid var(--green);
      opacity: 0;
      animation: fab-pulse 1.8s ease-out infinite;
    }
    @keyframes fab-pulse {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(1.5); opacity: 0;   }
    }
    .fab { position: relative; }

    /* ── Panel ── */
    .panel {
      position: absolute;
      bottom: 68px;
      ${POSITION}: 0;
      width: 320px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,0.55);
      transform-origin: bottom ${POSITION};
      transform: scale(0.88) translateY(12px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
    .panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* Panel header */
    .ph {
      padding: 14px 18px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px;
    }
    .ph-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--muted);
      flex-shrink: 0;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .ph-dot.live { background: var(--green); box-shadow: 0 0 8px var(--green-glow); }
    .ph-title { font-size: 14px; font-weight: 600; color: var(--text); flex: 1; }
    .ph-status { font-size: 11px; color: var(--muted); }

    /* Panel body */
    .pb {
      padding: 22px 18px 18px;
      display: flex; flex-direction: column; align-items: center; gap: 18px;
    }

    /* Orb */
    .orb-wrap { position: relative; width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; }
    .orb-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 1.5px solid var(--border);
      transition: border-color 0.5s, box-shadow 0.5s;
    }
    .orb-ring.live {
      border-color: var(--green);
      box-shadow: 0 0 28px var(--green-glow), inset 0 0 16px rgba(0,184,148,0.05);
    }
    .orb-pulse {
      position: absolute; inset: -10px; border-radius: 50%;
      border: 1px solid transparent;
    }
    .orb-pulse.live {
      border-color: rgba(0,184,148,0.2);
      animation: pulse 2s ease-out infinite;
    }
    @keyframes pulse { 0% { transform:scale(1); opacity:1; } 100% { transform:scale(1.4); opacity:0; } }

    /* Bars */
    .bars { display: flex; align-items: center; gap: 3px; height: 32px; }
    .bar  { width: 3px; height: 5px; background: var(--accent); border-radius: 2px; transition: height 0.08s ease, background 0.3s; }
    .bars.talking .bar { background: var(--green); animation: bounce 0.6s ease-in-out infinite alternate; }
    .bars.talking .bar:nth-child(1) { animation-delay: 0s;     }
    .bars.talking .bar:nth-child(2) { animation-delay: 0.07s;  }
    .bars.talking .bar:nth-child(3) { animation-delay: 0.14s;  }
    .bars.talking .bar:nth-child(4) { animation-delay: 0.21s;  }
    .bars.talking .bar:nth-child(5) { animation-delay: 0.28s;  }
    .bars.talking .bar:nth-child(6) { animation-delay: 0.21s;  }
    .bars.talking .bar:nth-child(7) { animation-delay: 0.14s;  }
    @keyframes bounce { 0% { height: 4px; } 100% { height: 26px; } }

    /* Call button */
    .call-btn {
      width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .call-btn:active { transform: scale(0.9); }
    .call-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .call-btn.start { background: var(--green); box-shadow: 0 4px 18px var(--green-glow); }
    .call-btn.start:not(:disabled):hover { transform: scale(1.06); box-shadow: 0 4px 26px rgba(0,184,148,0.55); }
    .call-btn.stop  { background: var(--red);   box-shadow: 0 4px 18px var(--red-glow);   }
    .call-btn.stop:not(:disabled):hover  { transform: scale(1.06); box-shadow: 0 4px 26px rgba(225,112,85,0.55);  }
    .call-btn svg   { width: 22px; height: 22px; fill: #fff; }

    /* Spinner */
    .spinner {
      display: none;
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.25);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Transcript */
    .transcript {
      width: 100%; max-height: 90px; overflow-y: auto;
      font-size: 12px; line-height: 1.65; color: var(--muted);
      scrollbar-width: thin; scrollbar-color: var(--border) transparent;
    }
    .transcript:empty::before { content: 'Transcript will appear here…'; color: #3a3a4e; font-style: italic; }
    .tline { margin-bottom: 3px; }
    .trole { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-right: 4px; }
    .trole.agent { color: var(--green); }
    .trole.user  { color: #a29bfe; }

    /* Footer */
    .pf { padding: 10px 18px; text-align: center; font-size: 10px; color: #3a3a4e; border-top: 1px solid var(--border); }
    .pf a { color: var(--accent); text-decoration: none; }

    @media (max-width: 400px) { .panel { width: calc(100vw - 48px); } }
  `;

  // ── HTML ────────────────────────────────────────────────────────────────────
  shadow.innerHTML = `
    <style>${css}</style>

    <div class="panel" id="panel">
      <div class="ph">
        <div class="ph-dot" id="phDot"></div>
        <div class="ph-title">${TITLE}</div>
        <div class="ph-status" id="phStatus">Ready</div>
      </div>

      <div class="pb">
        <div class="orb-wrap">
          <div class="orb-pulse" id="orbPulse"></div>
          <div class="orb-ring"  id="orbRing">
            <div style="display:flex;align-items:center;justify-content:center;height:100%;">
              <div class="bars" id="bars">
                <div class="bar"></div><div class="bar"></div><div class="bar"></div>
                <div class="bar"></div><div class="bar"></div><div class="bar"></div>
                <div class="bar"></div>
              </div>
            </div>
          </div>
        </div>

        <button class="call-btn start" id="callBtn">
          <svg id="iconMic"  viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          <svg id="iconStop" viewBox="0 0 24 24" style="display:none"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>
          <div class="spinner" id="spinner"></div>
        </button>

        <div class="transcript" id="transcript"></div>
      </div>

      <div class="pf">Powered by <a href="https://www.retellai.com" target="_blank">Retell AI</a> · <a href="https://awesomate.com.au" target="_blank">Awesomate</a></div>
    </div>

    <button class="fab" id="fab" aria-label="Talk to AI agent">
      <svg class="icon-mic"   viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
  `;

  // ── Element refs ────────────────────────────────────────────────────────────
  const fab        = shadow.getElementById('fab');
  const panel      = shadow.getElementById('panel');
  const callBtn    = shadow.getElementById('callBtn');
  const phDot      = shadow.getElementById('phDot');
  const phStatus   = shadow.getElementById('phStatus');
  const orbRing    = shadow.getElementById('orbRing');
  const orbPulse   = shadow.getElementById('orbPulse');
  const bars       = shadow.getElementById('bars');
  const transcript = shadow.getElementById('transcript');
  const spinner    = shadow.getElementById('spinner');
  const iconMic    = shadow.getElementById('iconMic');
  const iconStop   = shadow.getElementById('iconStop');

  // ── State ───────────────────────────────────────────────────────────────────
  let retellClient = null;
  let isCallActive = false;
  let panelOpen    = false;

  // ── SDK — start loading immediately so it's warm when the user clicks ───────
  let sdkPromise = null;
  function loadSdk() {
    if (!sdkPromise) {
      sdkPromise = import(
        'https://esm.sh/retell-client-js-sdk@2.0.7?deps=livekit-client@2.5.7,eventemitter3@5.0.1'
      ).then(m => m.RetellWebClient);
    }
    return sdkPromise;
  }
  loadSdk(); // warm-start in background

  // ── FAB click ───────────────────────────────────────────────────────────────
  fab.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    fab.classList.toggle('open', panelOpen);
  });

  // ── Call button ─────────────────────────────────────────────────────────────
  callBtn.addEventListener('click', async () => {
    if (isCallActive) {
      stopCall();
    } else {
      await startCall();
    }
  });

  // ── Start call ──────────────────────────────────────────────────────────────
  async function startCall() {
    setStatus('Connecting…');
    callBtn.disabled = true;
    iconMic.style.display  = 'none';
    spinner.style.display  = 'block';

    try {
      // 1. Get access token from n8n proxy (API key never touches the browser)
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: AGENT_ID }),
      });
      if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
      const { access_token } = await res.json();

      // 2. Load SDK (likely already cached from warm-start)
      const RetellWebClient = await loadSdk();
      retellClient = new RetellWebClient();

      // 3. Wire events
      retellClient.on('call_started', () => {
        isCallActive = true;
        callBtn.disabled = false;
        spinner.style.display = 'none';
        iconStop.style.display = 'block';
        callBtn.classList.replace('start', 'stop');
        orbRing.classList.add('live');
        orbPulse.classList.add('live');
        phDot.classList.add('live');
        fab.classList.add('live');
        setStatus('Connected — speak now');
      });

      retellClient.on('call_ended',         endCallUi);
      retellClient.on('error', (err) => { console.error('[RetellWidget]', err); endCallUi(); });

      retellClient.on('agent_start_talking', () => {
        bars.classList.add('talking');
        setStatus('Agent is speaking…');
      });
      retellClient.on('agent_stop_talking', () => {
        bars.classList.remove('talking');
        setStatus('Listening…');
      });

      retellClient.on('update', ({ transcript: t }) => {
        if (Array.isArray(t)) renderTranscript(t);
      });

      // 4. Start the WebRTC call
      await retellClient.startCall({ accessToken: access_token, sampleRate: 24000 });

    } catch (err) {
      console.error('[RetellWidget] startCall failed:', err);
      setStatus('Failed to connect');
      callBtn.disabled = false;
      spinner.style.display = 'none';
      iconMic.style.display = 'block';
    }
  }

  // ── Stop call ───────────────────────────────────────────────────────────────
  function stopCall() {
    retellClient?.stopCall();
    endCallUi();
  }

  function endCallUi() {
    isCallActive = false;
    callBtn.disabled = false;
    spinner.style.display = 'none';
    iconMic.style.display  = 'block';
    iconStop.style.display = 'none';
    callBtn.classList.replace('stop', 'start');
    orbRing.classList.remove('live');
    orbPulse.classList.remove('live');
    phDot.classList.remove('live');
    fab.classList.remove('live');
    bars.classList.remove('talking');
    transcript.innerHTML = '';
    setStatus('Call ended');
    setTimeout(() => {
      setStatus('Ready');
      panelOpen = false;
      panel.classList.remove('open');
      fab.classList.remove('open');
    }, 3000);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function setStatus(text) { phStatus.textContent = text; }

  function renderTranscript(arr) {
    transcript.innerHTML = arr.map(({ role, content }) =>
      `<div class="tline"><span class="trole ${role === 'agent' ? 'agent' : 'user'}">${role === 'agent' ? 'Agent' : 'You'}</span>${esc(content)}</div>`
    ).join('');
    transcript.scrollTop = transcript.scrollHeight;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

})();
