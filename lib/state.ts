import "server-only";
import snapshot from "@/data/callouts-snapshot.json";
import { BREAK_SECONDS, CHAIN, HAS_TOKEN, ROUND_SECONDS, SERVER_CACHE_MS, TOKEN_ADDRESS } from "./config";
import { buildState } from "./game";
import { fetchNewCallouts, hasGmgnKeys, toCallout, type RawMessage } from "./gmgn";
import { bridgeEnabled } from "./ingest";
import { getStore } from "./store";
import type { Callout, GameState } from "./types";

const token = { chain: CHAIN, address: TOKEN_ADDRESS };

// Survives dev hot reloads so the snapshot replay clock does not restart.
const g = globalThis as unknown as {
  __koth?: { bootAt: number; cache?: { at: number; state: GameState }; inflight?: Promise<GameState>; archive?: Map<string, Callout>; startAt?: number; beatAt?: number };
};
g.__koth ??= { bootAt: Date.now() };
const mem = g.__koth;

export async function getGameState(): Promise<GameState> {
  const now = Date.now();
  if (mem.cache && now - mem.cache.at < SERVER_CACHE_MS) return rebaseNow(mem.cache.state, now);
  mem.inflight ??= load(now).finally(() => (mem.inflight = undefined));
  const state = await mem.inflight;
  mem.cache = { at: now, state };
  return state;
}

// If the bridge hasn't posted for this long, the badge shows "Reconnecting…".
const BRIDGE_STALE_MS = 30_000;

// Data sources, in order of preference:
// 1. GMGN Callout OpenAPI (GMGN_AK/GMGN_SK): the server polls GMGN itself.
// 2. Browser bridge (INGEST_SECRET): a userscript on gmgn.ai pushes to /api/ingest.
// 3. Neither: replay the bundled snapshot (demo).
async function load(now: number): Promise<GameState> {
  if (!HAS_TOKEN) return { ...buildState({ callouts: [], now, roundSeconds: ROUND_SECONDS, breakSeconds: BREAK_SECONDS, token, source: "live" }), prelaunch: true };
  if (hasGmgnKeys()) return loadFromApi(now);
  if (bridgeEnabled()) return loadFromBridge(now);
  return snapshotState(now);
}

// The game starts the first time the site runs with this token address:
// that moment is stored (per token) and earlier call outs never count.
async function gameStart(): Promise<number> {
  if (mem.startAt) return mem.startAt;
  const store = getStore();
  const saved = Number(await store.getMeta("startAt"));
  if (saved) return (mem.startAt = saved);
  const now = Date.now();
  await store.setMeta("startAt", String(now));
  return (mem.startAt = now);
}

async function loadFromApi(now: number): Promise<GameState> {
  const store = getStore();
  const start = await gameStart();
  try {
    // Cold start: pull the whole archive once, then keep it in memory.
    if (!mem.archive) mem.archive = new Map((await store.all()).map((c) => [c.id, c]));
    const fresh = await fetchNewCallouts(CHAIN, TOKEN_ADDRESS, new Set(mem.archive.keys()), start);
    if (fresh.length) {
      await store.add(fresh);
      for (const c of fresh) mem.archive.set(c.id, c);
    }
    return live(now, start);
  } catch (err) {
    const error = err instanceof Error ? err.message : "GMGN unavailable";
    console.error("[koth] sync failed:", error);
    return live(now, start, error);
  }
}

// Serverless instances don't share memory, so the bridge path always reads
// the shared archive rather than a per-instance copy.
async function loadFromBridge(now: number): Promise<GameState> {
  const store = getStore();
  const [all, last, start] = await Promise.all([store.all(), store.getMeta("lastIngestAt"), gameStart()]);
  mem.archive = new Map(all.map((c) => [c.id, c]));
  const offline = !last || now - Number(last) > BRIDGE_STALE_MS;
  return live(now, start, offline ? "Bridge offline" : undefined);
}

export async function ingestCallouts(callouts: Callout[]): Promise<number> {
  const store = getStore();
  const added = await store.add(callouts);
  // Heartbeat: write at most every 15s per instance (bridge posts every 5s).
  const now = Date.now();
  if (callouts.length || !mem.beatAt || now - mem.beatAt > 15_000) {
    mem.beatAt = now;
    await store.setMeta("lastIngestAt", String(now));
  }
  if (added) mem.cache = undefined; // next read shows the new king right away
  return added;
}

function live(now: number, start: number, error?: string): GameState {
  const callouts = [...(mem.archive?.values() ?? [])].filter((c) => c.at >= start);
  return buildState({ callouts, now, roundSeconds: ROUND_SECONDS, breakSeconds: BREAK_SECONDS, token, source: "live", stale: Boolean(error), error });
}

// Without API keys we replay the real snapshot of the test token, shifted so
// it feels live. The replay loops: the newest call out lands 25s into each
// cycle (new king), the clock runs out (crowned + confetti), the break passes
// and the hill sits open for 30s before the loop starts again.
function snapshotState(now: number): GameState {
  // The bundled snapshot belongs to the test token; never replay it for another.
  if (snapshot.token.toLowerCase() !== TOKEN_ADDRESS) {
    return buildState({ callouts: [], now, roundSeconds: ROUND_SECONDS, breakSeconds: BREAK_SECONDS, token, source: "snapshot" });
  }
  const raw = (snapshot.messages as RawMessage[]).map(toCallout);
  const newest = Math.max(...raw.map((c) => c.at));
  const cycle = 25_000 + (ROUND_SECONDS + BREAK_SECONDS + 30) * 1000;
  const cycleStart = now - ((now - mem.bootAt) % cycle);
  const shift = cycleStart + 25_000 - newest;
  const callouts = raw.map((c) => ({ ...c, at: c.at + shift }));
  return buildState({ callouts, now, roundSeconds: ROUND_SECONDS, breakSeconds: BREAK_SECONDS, token, source: "snapshot" });
}

function rebaseNow(state: GameState, now: number): GameState {
  return { ...state, serverNow: now };
}
