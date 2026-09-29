// ==UserScript==
// @name         King of the Hill — GMGN call out bridge
// @namespace    koth
// @version      1.4.0
// @description  Reads the token's call outs from gmgn.ai every few seconds and sends them to the King of the Hill site.
// @match        https://gmgn.ai/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      *
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  // ── Config: edit these two lines ──────────────────────────────────────────
  const SITE = "http://localhost:3217"; // your site, e.g. https://kingofthehill.xyz
  const SECRET = "PASTE_INGEST_SECRET_HERE"; // same value as INGEST_SECRET on the site
  // ──────────────────────────────────────────────────────────────────────────

  const BASE = SITE.replace(/\/+$/, ""); // tolerate a trailing slash
  const EVERY_MS = 5000;
  // Chain and token come from the site (/api/config), so launching a new
  // token only needs the site's env vars. Re-read every minute.
  let game = null;
  let gameAt = 0;
  const feedUrl = (lang) => `/api/v1/token/${game.chain}/${game.token}/community/messages?from_app=gmgn&os=web&app_lang=${lang}&limit=50`;

  // Runs in a single gmgn.ai tab: extra tabs step aside.
  const LOCK = "koth-bridge-lock";
  const me = Math.random().toString(36).slice(2);
  const holdsLock = () => {
    const [id, ts] = (localStorage.getItem(LOCK) || "").split(":");
    if (!id || id === me || Date.now() - Number(ts) > EVERY_MS * 3) {
      localStorage.setItem(LOCK, `${me}:${Date.now()}`);
      return true;
    }
    return false;
  };

  const badge = document.createElement("div");
  Object.assign(badge.style, {
    position: "fixed", right: "12px", bottom: "12px", zIndex: 2147483647, padding: "6px 10px",
    font: "12px/1.3 monospace", color: "#0f1d3a", background: "#fbd322", border: "3px solid #0f1d3a",
    boxShadow: "0 4px 0 rgba(0,0,0,.3)", pointerEvents: "none",
  });
  const show = (text, ok = true) => {
    badge.textContent = `👑 KOTH bridge · ${text}`;
    badge.style.background = ok ? "#fbd322" : "#c23729";
    badge.style.color = ok ? "#0f1d3a" : "#fff";
    if (!badge.isConnected) document.body.appendChild(badge);
  };

  const getConfig = () =>
    new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `${BASE}/api/config`,
        timeout: 10000,
        onload: (r) => (r.status === 200 ? resolve(JSON.parse(r.responseText)) : reject(new Error(`config ${r.status}`))),
        onerror: () => reject(new Error("site unreachable")),
        ontimeout: () => reject(new Error("site timeout")),
      });
    });

  const post = (payload) =>
    new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${BASE}/api/ingest`,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SECRET}` },
        data: JSON.stringify(payload),
        timeout: 10000,
        onload: (r) => (r.status === 200 ? resolve(JSON.parse(r.responseText)) : reject(new Error(`site ${r.status}: ${r.responseText.slice(0, 80)}`))),
        onerror: () => reject(new Error("site unreachable")),
        ontimeout: () => reject(new Error("site timeout")),
      });
    });

  // Chrome throttles timers in background tabs to ~1/min after 5 minutes.
  // Timers inside a worker are not throttled that way, so the worker keeps
  // the beat and the page just reacts to its messages.
  const clock = (() => {
    try {
      const src = "let t;onmessage=e=>{clearTimeout(t);t=setTimeout(()=>postMessage(0),e.data)}";
      const w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
      return { after: (ms, fn) => ((w.onmessage = fn), w.postMessage(ms)) };
    } catch {
      return { after: (ms, fn) => setTimeout(fn, ms) };
    }
  })();

  let failures = 0;
  let total = 0;
  const sent = new Map(); // ulid -> last signature posted
  const tick = async () => {
    let wait = EVERY_MS;
    try {
      if (!holdsLock()) {
        show("standby (another gmgn tab is sending)");
        return;
      }
      if (!game || Date.now() - gameAt > 60000) {
        game = await getConfig();
        gameAt = Date.now();
      }
      // Pre-launch: the site has no token address yet. Wait and re-check.
      if (!game.token) {
        game = null;
        show("waiting for the CA (pre-launch)");
        wait = 30000;
        return;
      }
      // Same feed twice: GMGN translates display_content into app_lang.
      const read = async (lang) => {
        const res = await fetch(feedUrl(lang), { credentials: "include" });
        if (!res.ok) throw new Error(`gmgn ${res.status}`);
        const list = (await res.json())?.data?.messages;
        if (!Array.isArray(list)) throw new Error("gmgn: unexpected response");
        return list;
      };
      const [messages, zh] = await Promise.all([read("en"), read("zh-CN").catch(() => [])]);
      const zhById = new Map(zh.map((m) => [m.ulid, m.display_content]));
      for (const m of messages) m.display_content_zh = zhById.get(m.ulid) || undefined;
      // Only send what changed since the last successful post (keeps the
      // free Redis tier well within limits). An empty post is the heartbeat.
      const sig = (m) => `${m.display_content || ""}|${m.display_content_zh || ""}`;
      const changed = messages.filter((m) => sent.get(m.ulid) !== sig(m));
      const out = await post({ chain: game.chain, token: game.token, messages: changed });
      for (const m of changed) sent.set(m.ulid, sig(m));
      total += out.added;
      failures = 0;
      show(`live ${new Date().toLocaleTimeString()} · ${game.token.slice(0, 6)}…${game.token.slice(-4)} · +${total} new`);
    } catch (err) {
      failures += 1;
      wait = Math.min(60000, EVERY_MS * 2 ** Math.min(failures, 4));
      show(`${err.message} · retry in ${Math.round(wait / 1000)}s`, false);
    } finally {
      clock.after(wait, tick);
    }
  };

  show("starting…");
  tick();
})();
