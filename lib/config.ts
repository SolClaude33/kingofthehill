// Game + token configuration. Public values are safe for the browser;
// GMGN_AK / GMGN_SK are read only in lib/gmgn.ts (server).

export const CHAIN = process.env.NEXT_PUBLIC_CHAIN || "bsc";

// The token being played. No default: without a valid CA the site runs in
// pre-launch mode (no CA shown, no token links, no game). Set it in Vercel and
// redeploy to launch — NEXT_PUBLIC_* values are baked in at build time.
export const TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "").trim().toLowerCase();
export const HAS_TOKEN = /^0x[0-9a-f]{40}$/.test(TOKEN_ADDRESS);

export const TOKEN_TICKER = "$KING";

// Seconds a call out holds the hill before its caller is crowned.
// Confirmed by Nicol 2026-09-27: 5 minutes without a new call out crowns the king.
export const ROUND_SECONDS = Number(process.env.NEXT_PUBLIC_ROUND_SECONDS || 300);

// Break after a coronation before the hill opens again (confirmed: 1 minute).
export const BREAK_SECONDS = Number(process.env.NEXT_PUBLIC_BREAK_SECONDS || 60);

// Project X/Twitter profile (set in Vercel). Button hides when empty.
export const TWITTER_URL = process.env.NEXT_PUBLIC_TWITTER_URL || "";

export const GMGN_TOKEN_URL = HAS_TOKEN ? `https://gmgn.ai/${CHAIN}/token/${TOKEN_ADDRESS}` : "";
export const FLAP_TOKEN_URL = HAS_TOKEN ? `https://flap.sh/bnb/${TOKEN_ADDRESS}` : "";
export const BSCSCAN_ADDRESS_URL = (addr: string) => `https://bscscan.com/address/${addr}`;

// How often the browser asks /api/state for news, and how long the server
// reuses one GMGN response (keeps us well under the per-key rate limit).
export const POLL_MS = 8_000;
export const SERVER_CACHE_MS = 6_000;
