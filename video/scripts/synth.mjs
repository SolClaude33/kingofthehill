// Code-only music + SFX engine for promo trailers. No samples, no AI: every sound is synthesised here.
// Usage (see audio-promo.mjs): const mix = createMix({ bpm, totalBeats }); ...place notes/cues...; mix.render(path)
// Times passed to instruments are in SECONDS; use mix.B(beat) to convert beats.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const TAU = Math.PI * 2;
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

class Biquad {
  constructor(sr, type, f, q = 0.707) {
    this.sr = sr;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(type, f, q);
  }
  set(type, f, q = 0.707) {
    const w = (TAU * Math.min(Math.max(f, 10), this.sr * 0.45)) / this.sr;
    const c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2;
    if (type === "lp") [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
    else if (type === "hp") [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
    else [b0, b1, b2] = [a, 0, -a]; // band-pass
    const a0 = 1 + a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = (-2 * c) / a0; this.a2 = (1 - a) / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

export function createMix({ bpm, totalBeats, sr = 44100, seed = 20260926, tail = 0.05 }) {
  const SR = sr;
  const SPB = 60 / bpm;
  const B = (beat) => beat * SPB;
  const END = B(totalBeats);
  const N = Math.ceil((END + tail) * SR);

  let s = seed;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const noise = () => rnd() * 2 - 1;
  const bq = (type, f, q) => new Biquad(SR, type, f, q);

  const bus = () => [new Float32Array(N), new Float32Array(N)];
  const MUS = bus(); // ducked by the kick (sidechain)
  const DRM = bus();
  const SFX = bus();
  const REV = bus();
  const DLY = bus();
  const sc = new Float32Array(N).fill(1);
  const kickTimes = [];

  const put = (b, i, v, pan = 0) => {
    if (i < 0 || i >= N) return;
    const a = ((pan + 1) * Math.PI) / 4;
    b[0][i] += v * Math.cos(a) * 1.414;
    b[1][i] += v * Math.sin(a) * 1.414;
  };
  const send = (b, i, v, pan, rev = 0, dly = 0) => {
    put(b, i, v, pan);
    if (rev) put(REV, i, v * rev, pan);
    if (dly) put(DLY, i, v * dly, pan);
  };
  const span = (t0, dur) => [Math.round(t0 * SR), Math.round(dur * SR)];

  /* ───────── drums ───────── */
  function kick(t0, vel = 1) {
    kickTimes.push(t0);
    const [i0, n] = span(t0, 0.5);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      ph += (TAU * (44 + 125 * Math.exp(-t * 32))) / SR;
      let v = Math.sin(ph) * Math.exp(-t * 6.8);
      if (t < 0.004) v += noise() * 0.35 * (1 - t / 0.004);
      put(DRM, i0 + k, Math.tanh(v * 1.7) * 0.78 * vel, 0);
    }
  }
  function clap(t0, vel = 1, pan = 0.04) {
    const [i0, n] = span(t0, 0.38);
    const bp = bq("bp", 1250, 0.8), hp = bq("hp", 700);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      let env = 0;
      for (const o of [0, 0.011, 0.023]) if (t >= o) env = Math.max(env, Math.exp(-(t - o) * 230));
      if (t >= 0.023) env = Math.max(env, 0.5 * Math.exp(-(t - 0.023) * 15));
      send(DRM, i0 + k, bp.run(hp.run(noise())) * env * 1.5 * vel, pan, 0.22);
    }
  }
  function hat(t0, vel = 1, open = false, pan = 0.2) {
    const [i0, n] = span(t0, open ? 0.3 : 0.07);
    const hp = bq("hp", 7500, 0.9);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      send(DRM, i0 + k, hp.run(noise()) * Math.exp(-t * (open ? 13 : 55)) * 0.26 * vel, pan, open ? 0.08 : 0);
    }
  }
  function shaker(t0, vel = 1) {
    const [i0, n] = span(t0, 0.09);
    const bp = bq("bp", 5800, 1.3);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      put(DRM, i0 + k, bp.run(noise()) * Math.min(1, t / 0.006) * Math.exp(-t * 34) * 0.24 * vel, -0.25);
    }
  }
  function crash(t0, vel = 1) {
    const [i0, n] = span(t0, 2.2);
    const hp = bq("hp", 4200, 0.6);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      send(DRM, i0 + k, hp.run(noise()) * Math.exp(-t * 1.9) * 0.16 * vel, k % 2 ? 0.15 : -0.15, 0.15);
    }
  }

  /* ───────── tonal (m = MIDI note) ───────── */
  function bass(t0, m, d, vel = 1) {
    const f = mtof(m);
    const [i0, n] = span(t0, d + 0.09);
    const lp = bq("lp", 500, 1.2);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      ph += f / SR;
      if (k % 32 === 0) lp.set("lp", 220 + 1500 * Math.exp(-t * 16), 1.25);
      const rel = t < d ? 1 : Math.exp(-(t - d) * 70);
      const env = Math.min(1, t / 0.004) * (0.55 + 0.45 * Math.exp(-t * 7)) * rel;
      put(MUS, i0 + k, (lp.run(2 * (ph % 1) - 1) * 0.5 + Math.sin(TAU * ph) * 0.62) * env * 0.62 * vel, 0);
    }
  }
  function pad(t0, notes, d, { cut = 2000, cutEnd = cut, vel = 1, att = 0.25, rel = 0.7 } = {}) {
    const [i0, n] = span(t0, d + rel * 3);
    notes.forEach((m, ni) => {
      [-8, 0, 8].forEach((cents, vi) => {
        const f = mtof(m) * Math.pow(2, cents / 1200);
        const lp = bq("lp", cut, 0.8);
        let ph = rnd();
        const pan = (vi - 1) * 0.65 + (ni % 2 ? 0.1 : -0.1);
        for (let k = 0; k < n; k++) {
          const t = k / SR;
          if (k % 64 === 0) lp.set("lp", cut + (cutEnd - cut) * Math.min(1, t / d), 0.8);
          ph += f / SR;
          const env = Math.min(1, t / att) * (t < d ? 1 : Math.exp(((-(t - d) / rel) * 2.3)));
          send(MUS, i0 + k, lp.run(2 * (ph % 1) - 1) * env * 0.034 * vel, pan, 0.3);
        }
      });
    });
  }
  function keys(t0, notes, d, vel = 1) {
    // FM electric piano
    const [i0, n] = span(t0, d + 0.4);
    notes.forEach((m, ni) => {
      const f = mtof(m);
      const pan = (ni / Math.max(1, notes.length - 1) - 0.5) * 0.6;
      for (let k = 0; k < n; k++) {
        const t = k / SR;
        const idx = 2.0 * Math.exp(-t * 7) + 0.25;
        const tine = Math.sin(TAU * f * 14 * t) * 0.35 * Math.exp(-t * 35);
        const env = Math.min(1, t / 0.002) * Math.exp(-t * 2.8) * (t < d ? 1 : Math.exp(-(t - d) * 14));
        send(MUS, i0 + k, Math.sin(TAU * f * t + Math.sin(TAU * f * t) * idx + tine) * env * 0.075 * vel, pan, 0.2);
      }
    });
  }
  function pluck(t0, m, vel = 1, pan = 0) {
    const f = mtof(m);
    const [i0, n] = span(t0, 0.7);
    const lp = bq("lp", 4000, 1.1);
    let p1 = rnd(), p2 = rnd();
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      if (k % 32 === 0) lp.set("lp", 700 + 5200 * Math.exp(-t * 24), 1.1);
      p1 += f / SR; p2 += (f * 1.004) / SR;
      const v = lp.run(2 * (p1 % 1) - 1 + (2 * (p2 % 1) - 1) * 0.6) * Math.min(1, t / 0.002) * Math.exp(-t * 7.5) * 0.07 * vel;
      send(MUS, i0 + k, v, pan, 0.14, 0.32);
    }
  }
  function mallet(t0, m, vel = 1, pan = 0) {
    // marimba-ish lead
    const f = mtof(m);
    const [i0, n] = span(t0, 1.4);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      const v =
        (Math.sin(TAU * f * t + 0.6 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 9)) * Math.exp(-t * 4.2) +
          0.3 * Math.sin(TAU * f * 4 * t) * Math.exp(-t * 20) +
          0.12 * Math.sin(TAU * f * 9.7 * t) * Math.exp(-t * 45)) *
        Math.min(1, t / 0.0015) * 0.15 * vel;
      send(MUS, i0 + k, v, pan, 0.26, 0.2);
    }
  }
  function bell(t0, m, vel = 1, pan = 0) {
    const f = mtof(m);
    const [i0, n] = span(t0, 2.2);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      const v = Math.sin(TAU * f * t + Math.sin(TAU * f * 3.5 * t) * 1.6 * Math.exp(-t * 3.5)) * Math.min(1, t / 0.002) * Math.exp(-t * 2.6) * 0.09 * vel;
      send(SFX, i0 + k, v, pan, 0.4, 0.15);
    }
  }

  /* ───────── sfx (len in beats where noted) ───────── */
  function whoosh(t0, lenBeats = 0.6, vel = 1) {
    const [i0, n] = span(t0 - 0.04, lenBeats * SPB * 1.25);
    const bp = bq("bp", 500, 0.7), bp2 = bq("bp", 900, 1.1);
    for (let k = 0; k < n; k++) {
      const x = k / n;
      const shape = x < 0.38 ? Math.pow(x / 0.38, 2) : Math.pow(1 - (x - 0.38) / 0.62, 1.6);
      if (k % 32 === 0) { bp.set("bp", 250 + 3200 * shape, 0.7); bp2.set("bp", 500 + 5200 * shape, 1.4); }
      const nz = noise();
      send(SFX, i0 + k, (bp.run(nz) * 0.9 + bp2.run(nz) * 0.35) * shape * 0.62 * vel, -0.7 + 1.4 * x, 0.18);
    }
  }
  function riser(t0, lenBeats = 2, vel = 1) {
    const [i0, n] = span(t0, lenBeats * SPB);
    const bp = bq("bp", 400, 1.0);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const x = k / n;
      if (k % 32 === 0) bp.set("bp", 350 + 7000 * x * x, 1.0);
      ph += (110 * Math.pow(2, x * 2.5)) / SR;
      send(SFX, i0 + k, (bp.run(noise()) * 0.8 + (2 * (ph % 1) - 1) * 0.08) * Math.pow(x, 2.2) * 0.42 * vel, Math.sin(x * 18) * 0.35, 0.2);
    }
  }
  function impact(t0, vel = 1) {
    const [i0, n] = span(t0, 2.4);
    const lp = bq("lp", 2600, 0.7);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      ph += (TAU * (30 + 42 * Math.exp(-t * 5))) / SR;
      const hit = lp.run(noise()) * Math.exp(-t * 9) * 0.45;
      put(SFX, i0 + k, Math.tanh((Math.sin(ph) * Math.exp(-t * 1.9) * 0.95 + hit) * 1.2) * 0.8 * vel, 0);
      put(REV, i0 + k, hit * 0.9, 0);
    }
  }
  function suck(t0, lenBeats = 0.5, vel = 1) {
    // reversed swell that ends lenBeats after t0 (lands on the next hit)
    const [i0, n] = span(t0, lenBeats * SPB);
    const bp = bq("bp", 3000, 0.8);
    for (let k = 0; k < n; k++) {
      const x = k / n;
      if (k % 32 === 0) bp.set("bp", 4500 - 3600 * x, 0.8);
      send(SFX, i0 + k, bp.run(noise()) * Math.pow(x, 3) * 0.55 * vel, 0, 0.1);
    }
  }
  function pop(t0, pitch = 0, vel = 1, base = 74) {
    const f0 = mtof(base + pitch);
    const [i0, n] = span(t0, 0.22);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      ph += (f0 * (1 + 0.6 * Math.exp(-t * 70))) / SR;
      send(SFX, i0 + k, (Math.sin(TAU * ph) + 0.25 * Math.sin(TAU * ph * 2)) * Math.min(1, t / 0.001) * Math.exp(-t * 26) * 0.2 * vel, 0, 0.18);
    }
  }
  function click(t0, vel = 1) {
    for (const [o, g] of [[0, 1], [0.065, 0.55]]) {
      const [i0, n] = span(t0 + o, 0.03);
      const hp = bq("hp", 2500, 0.9);
      for (let k = 0; k < n; k++) {
        const t = k / SR;
        send(SFX, i0 + k, (hp.run(noise()) * Math.exp(-t * 900) * 0.9 + Math.sin(TAU * 1900 * t) * Math.exp(-t * 320) * 0.5) * 0.42 * g * vel, 0.1, 0.06);
      }
    }
  }
  function tick(t0, vel = 1) {
    // one key press
    const [i0, n] = span(t0, 0.045);
    const bp = bq("bp", 3200 + rnd() * 1400, 2.2);
    const pan = (rnd() - 0.5) * 0.35;
    const f = 170 + rnd() * 60;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      send(SFX, i0 + k, (bp.run(noise()) * Math.exp(-t * 700) * 1.4 + Math.sin(TAU * f * t) * Math.exp(-t * 110) * 0.5) * 0.3 * vel, pan);
    }
  }
  function stamp(t0, vel = 1) {
    const [i0, n] = span(t0, 0.5);
    const bp = bq("bp", 1900, 0.9);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      ph += (TAU * (52 + 80 * Math.exp(-t * 26))) / SR;
      const v = Math.sin(ph) * Math.exp(-t * 8) * 0.8 + bp.run(noise()) * Math.exp(-t * 32) * 0.7;
      send(SFX, i0 + k, Math.tanh(v * 1.4) * 0.62 * vel, 0, 0.2);
    }
  }
  function chime(t0, pitch = 0, base = 74) {
    [0, 7, 12].forEach((o, i) => bell(t0 + i * 0.065, base + pitch + o, 1 - i * 0.15, (i - 1) * 0.35));
  }

  /** Place every cue and typing tick from the shared timeline.json (beats). */
  function applyTimeline(TL, { popBase = 74, chimeBase = 74 } = {}) {
    for (const c of TL.cues ?? []) {
      const t = B(c.beat);
      switch (c.type) {
        case "whoosh": whoosh(t, c.len ?? 0.6, c.vel ?? 1); break;
        case "riser": riser(t, c.len ?? 2, c.vel ?? 1); break;
        case "impact": impact(t, c.vel ?? 1); break;
        case "suck": suck(t, c.len ?? 0.5, c.vel ?? 1); break;
        case "pop": pop(t, c.pitch ?? 0, c.vel ?? 1, popBase); break;
        case "click": click(t, c.vel ?? 1); break;
        case "chime": chime(t, c.pitch ?? 0, chimeBase); break;
        case "stamp": stamp(t, c.vel ?? 1); break;
        default: console.warn("unknown cue type", c.type);
      }
    }
    // Same formula as typed() in lib.tsx: char i appears at from + (i+1)/(len+0.999)*(to-from)
    for (const ty of TL.typing ?? []) {
      const len = ty.text.length;
      for (let i = 0; i < len; i++) {
        if (ty.text[i] === " ") continue;
        tick(B(ty.from + ((i + 1) / (len + 0.999)) * (ty.to - ty.from)), 0.75 + rnd() * 0.3);
      }
    }
  }

  /* ───────── fx returns + master ───────── */
  function reverb([inL, inR]) {
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
    const aps = [556, 441, 341, 225];
    const out = [new Float32Array(N), new Float32Array(N)];
    [0, 1].forEach((ch) => {
      const spread = ch ? 23 : 0;
      const cb = combs.map((l) => ({ buf: new Float32Array(l + spread), i: 0, lp: 0 }));
      const ab = aps.map((l) => ({ buf: new Float32Array(l + spread), i: 0 }));
      const src = ch ? inR : inL;
      for (let n = 0; n < N; n++) {
        const x = src[n] * 0.015;
        let y = 0;
        for (const c of cb) {
          const o = c.buf[c.i];
          c.lp = o * 0.72 + c.lp * 0.28;
          c.buf[c.i] = x + c.lp * 0.86;
          c.i = (c.i + 1) % c.buf.length;
          y += o;
        }
        for (const a of ab) {
          const o = a.buf[a.i];
          a.buf[a.i] = y + o * 0.5;
          a.i = (a.i + 1) % a.buf.length;
          y = o - y;
        }
        out[ch][n] = y;
      }
    });
    return out;
  }
  function delay([inL, inR], beats = 0.75) {
    const d = Math.round(B(beats) * SR);
    const out = [new Float32Array(N), new Float32Array(N)];
    let lpL = 0, lpR = 0;
    for (let n = 0; n < N; n++) {
      const fbL = n >= d ? out[1][n - d] : 0; // ping-pong
      const fbR = n >= d ? out[0][n - d] : 0;
      lpL = lpL * 0.45 + (inL[n] + fbL * 0.4) * 0.55;
      lpR = lpR * 0.45 + (inR[n] + fbR * 0.4) * 0.55;
      out[0][n] = lpL;
      out[1][n] = lpR;
    }
    return out;
  }

  /** Mix down, fade the last `fadeBeats`, normalise to -1 dBFS and write a 16-bit WAV. */
  function render(outPath, { fadeBeats = 5, duck = 0.62, delayBeats = 0.75 } = {}) {
    for (const tk of kickTimes) {
      const [i0, n] = span(tk, 0.32);
      for (let k = 0; k < n && i0 + k < N; k++) {
        const t = k / SR;
        const g = 1 - duck * Math.min(1, t / 0.005) * Math.exp(-t * 15);
        if (g < sc[i0 + k]) sc[i0 + k] = g;
      }
    }
    const rv = reverb(REV);
    const dl = delay(DLY, delayBeats);
    const L = new Float32Array(N), R = new Float32Array(N);
    const hpL = bq("hp", 28, 0.7), hpR = bq("hp", 28, 0.7);
    const fadeFrom = B(totalBeats - fadeBeats);
    let peak = 0;
    for (let n = 0; n < N; n++) {
      const t = n / SR;
      const fade = t < fadeFrom ? 1 : Math.max(0, 1 - (t - fadeFrom) / (END - fadeFrom)) ** 1.6;
      const l = MUS[0][n] * sc[n] + DRM[0][n] + SFX[0][n] * 0.95 + rv[0][n] * 0.9 + dl[0][n] * 0.5;
      const r = MUS[1][n] * sc[n] + DRM[1][n] + SFX[1][n] * 0.95 + rv[1][n] * 0.9 + dl[1][n] * 0.5;
      L[n] = Math.tanh(hpL.run(l) * 0.9) * fade;
      R[n] = Math.tanh(hpR.run(r) * 0.9) * fade;
      peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
    }
    const g = 0.89 / (peak || 1);
    const buf = Buffer.alloc(44 + N * 4);
    buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
    buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
    buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
    buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
    for (let n = 0; n < N; n++) {
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4);
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * g)) * 32767), 46 + n * 4);
    }
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, buf);
    console.log(`${outPath}: ${(N / SR).toFixed(2)}s, peak ${peak.toFixed(3)} -> gain ${g.toFixed(3)}`);
  }

  return {
    B, SPB, SR, rnd,
    kick, clap, hat, shaker, crash,
    bass, pad, keys, pluck, mallet, bell,
    whoosh, riser, impact, suck, pop, click, tick, stamp, chime,
    applyTimeline, render,
  };
}
