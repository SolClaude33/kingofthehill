// Motion toolkit for code-only promo trailers (Remotion 4). Everything is timed in BEATS from timeline.json.
import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
// The site's own fonts: Pixelify Sans (display), Jersey 10 (digits), DotGothic16 (body).
import { loadFont as loadPixel } from "@remotion/google-fonts/PixelifySans";
import { loadFont as loadDigits } from "@remotion/google-fonts/Jersey10";
import { loadFont as loadBody } from "@remotion/google-fonts/DotGothic16";
import TL from "./timeline.json";

export const { fontFamily: PIXEL } = loadPixel("normal", { weights: ["500", "700"], subsets: ["latin"] });
export const { fontFamily: DIGITS } = loadDigits("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: BODY } = loadBody("normal", { weights: ["400"], subsets: ["latin"] });
export const SANS = PIXEL;
export const MONO = DIGITS;

export const FPS = TL.fps;
export const SPB = 60 / TL.bpm; // seconds per beat
export const b2f = (beat: number) => Math.round(beat * SPB * FPS);
export const TOTAL_FRAMES = b2f(TL.totalBeats);

/** Local beat inside the current <Sequence> (scene-relative). */
export const useBeat = () => useCurrentFrame() / FPS / SPB;

/* King of the Hill tokens (app/globals.css). */
export const C = {
  skyTop: "#489ffa",
  sky: "#58b2fa",
  skyLow: "#6dcbfb",
  cloud: "#f4f9ff",
  grass: "#94df50",
  grassDk: "#3f9a2c",
  gold: "#fbd322",
  goldDk: "#e0a412",
  goldInk: "#483114",
  ruby: "#c23729",
  parchment: "#fff6dc",
  ink: "#0f1d3a",
  inkSoft: "#33466e",
  mine: "#2a1a0e",
  crypt: "#161a2e",
  bedrock: "#1d1c21",
  // aliases used by the template helpers
  bg: "#fff6dc",
  surface: "#fff6dc",
  brand: "#fbd322",
  btn: "#fbd322",
  eyebrow: "#fbd322",
  muted: "#33466e",
  line: "#0f1d3a",
  cream: "#fff6dc",
  dim: "#a9b4cc",
  good: "#3f9a2c",
};
export const PALETTE = ["#fbd322", "#c23729", "#94df50", "#58b2fa", "#f8ce5e", "#3f9a2c", "#fff6dc", "#e0a412"];

export const E = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  expo: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  whip: Easing.bezier(0.83, 0, 0.17, 1), // whip-pans: slow-fast-slow
};

/** Tween a value between two beats (clamped). */
export const tw = (t: number, t0: number, t1: number, from: number, to: number, ease: (x: number) => number = E.out) =>
  interpolate(t, [t0, t1], [from, to], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
/** 0..1 progress between two beats. */
export const pr = (t: number, t0: number, t1: number, ease: (x: number) => number = E.out) => tw(t, t0, t1, 0, 1, ease);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Damped spring from beat t0: 0 before, overshoots, settles at 1. Good for pops and drops. */
export const springAt = (t: number, t0: number, stiffness = 11, damping = 0.55) => {
  if (t <= t0) return 0;
  const x = (t - t0) * SPB;
  return 1 - Math.exp(-x * stiffness * damping) * Math.cos(x * stiffness * Math.sqrt(1 - damping * damping));
};

/** Typewriter state for a timeline "typing" entry. Pass the GLOBAL beat (scene start + local t). */
export const typed = (id: string, globalBeat: number) => {
  const ty = TL.typing.find((x) => x.id === id)!;
  const n = Math.floor(tw(globalBeat, ty.from, ty.to, 0, ty.text.length + 0.999, (x) => x));
  return { text: ty.text.slice(0, Math.min(n, ty.text.length)), started: globalBeat >= ty.from, done: globalBeat >= ty.to, full: ty.text };
};

export const Fill: React.FC<{ bg?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ bg, style, children }) => (
  <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden", fontFamily: SANS, ...style }}>{children}</div>
);

/** Word rising out of a mask. The workhorse of kinetic type: stagger words by ~0.15–0.2 beats. */
export const Rise: React.FC<{ t: number; at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, at, dur = 0.7, children, style }) => {
  const k = pr(t, at, at + dur, E.expo);
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.08em", marginBottom: "-0.08em", ...style }}>
      <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 105}%)` }}>{children}</span>
    </span>
  );
};

export const Eyebrow: React.FC<{ t: number; at: number; text: string; color?: string; size?: number }> = ({ t, at, text, color = C.eyebrow, size = 26 }) => {
  const k = pr(t, at, at + 1, E.expo);
  return <div style={{ fontFamily: PIXEL, fontSize: size, fontWeight: 700, letterSpacing: `${0.4 - k * 0.22}em`, color, opacity: k, textTransform: "uppercase", textShadow: `3px 3px 0 ${C.ink}` }}>{text}</div>;
};

export const Caret: React.FC<{ t: number; on?: boolean; color?: string; w?: number }> = ({ t, on = true, color = C.brand, w = 6 }) => (
  <span style={{ display: "inline-block", width: w, height: "0.9em", background: color, marginLeft: 6, verticalAlign: "-0.08em", opacity: on && Math.floor(t * 2) % 2 === 0 ? 1 : 0 }} />
);

/** Pointer with press squash + click ripple. `clicks` are LOCAL beats; put a matching "click" cue in timeline.json. */
export const Cursor: React.FC<{ x: number; y: number; t: number; clicks?: number[]; scale?: number; opacity?: number }> = ({ x, y, t, clicks = [], scale = 1, opacity = 1 }) => {
  let press = 0;
  let ripple: number | null = null;
  for (const c of clicks) {
    if (t >= c - 0.12 && t < c + 0.35) press = Math.max(press, t < c ? pr(t, c - 0.12, c, E.inOut) : 1 - pr(t, c, c + 0.35, E.out));
    if (t >= c && t < c + 1.2) ripple = pr(t, c, c + 1.2, E.out);
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, zIndex: 50, opacity, pointerEvents: "none" }}>
      {ripple !== null && (
        <div style={{ position: "absolute", left: -70 * scale, top: -70 * scale, width: 140 * scale, height: 140 * scale, borderRadius: "50%", border: `${4 * scale}px solid ${C.gold}`, transform: `scale(${0.2 + ripple * 0.9})`, opacity: 1 - ripple }} />
      )}
      <svg width={46 * scale} height={56 * scale} viewBox="0 0 23 28" style={{ position: "absolute", left: -3 * scale, top: -2 * scale, transform: `scale(${1 - press * 0.16})`, transformOrigin: "10% 10%", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.28))" }}>
        <path d="M2 1.5 L2 22.5 L7.4 17.6 L11.2 26 L15 24.3 L11.3 16.2 L18.6 16.2 Z" fill="#fff" stroke={C.ink} strokeWidth={1.8} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/**
 * Camera over a flat UI plane: keeps plane point (fx, fy) at screen (sx, sy) with scale s, plus a 3D tilt.
 * Put UI AND the Cursor inside, in plane coordinates, so clicks stay on target however the camera moves.
 * Animate fx/fy/s between focus points to get "zoom to the button" moves.
 */
export const Plane: React.FC<{ w: number; h: number; fx: number; fy: number; s: number; rx: number; ry: number; rz?: number; sx?: number; sy?: number; children: React.ReactNode }> = ({
  w, h, fx, fy, s, rx, ry, rz = 0, sx = 960, sy = 600, children,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0", transform: `translate(${sx - fx * s}px, ${sy - fy * s}px) scale(${s})` }}>
    <div style={{ position: "absolute", inset: 0, perspective: 2600, perspectiveOrigin: `${fx}px ${fy}px` }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: `${fx}px ${fy}px`, transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>{children}</div>
    </div>
  </div>
);

/** Top scrim so a zoomed UI plane never shows through a scene title. */
export const TopScrim: React.FC<{ color?: string; h?: number }> = ({ color = C.bg, h = 300 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, zIndex: 90, background: `linear-gradient(to bottom, ${color} 62%, transparent)` }} />
);

export const Grid: React.FC<{ color?: string; size?: number }> = ({ color = "rgba(213,206,195,.45)", size = 96 }) => (
  <div
    style={{
      position: "absolute",
      inset: -200,
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      WebkitMaskImage: "radial-gradient(55% 55% at 50% 50%, #000 20%, transparent 75%)",
      maskImage: "radial-gradient(55% 55% at 50% 50%, #000 20%, transparent 75%)",
    }}
  />
);

/** Restrained brand-colour glow for dark scenes (keep alpha low; no generic gradients). */
export const Glow: React.FC<{ x?: string; y?: string; a?: number; rgb?: string }> = ({ x = "50%", y = "115%", a = 0.14, rgb = "254,83,1" }) => (
  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 55% at ${x} ${y}, rgba(${rgb},${a}), transparent 70%)` }} />
);

export const Chip: React.FC<{ label: string; color: string; size?: number; style?: React.CSSProperties }> = ({ label, color, size = 30, style }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.42, background: C.surface, borderRadius: 999,
      padding: `${size * 0.46}px ${size * 0.85}px ${size * 0.46}px ${size * 0.62}px`, fontSize: size, fontWeight: 600, color: C.ink,
      boxShadow: "0 2px 4px rgba(20,14,6,.06), 0 22px 44px -16px rgba(20,14,6,.32)", whiteSpace: "nowrap", ...style,
    }}
  >
    <span style={{ width: size * 0.46, height: size * 0.46, borderRadius: "50%", background: color }} />
    {label}
  </div>
);

/** Donut from weights; `reveal` 0..1 sweeps clockwise. */
export const Donut: React.FC<{ weights: number[]; size: number; stroke: number; reveal?: number; palette?: string[]; gap?: number }> = ({ weights, size, stroke, reveal = 1, palette = PALETTE, gap = 0.006 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
      {weights.map((w, i) => {
        const start = acc / total;
        acc += w;
        const len = Math.max(0, Math.min(acc / total, reveal) - Math.min(start, reveal) - gap) * circ;
        if (len <= 0) return null;
        return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={palette[i % palette.length]} strokeWidth={stroke} strokeDasharray={`${len} ${circ}`} strokeDashoffset={-Math.min(start, reveal) * circ} />;
      })}
    </svg>
  );
};

/** Decorative rising sparkline (no figures). */
export const Spark: React.FC<{ w: number; h: number; seed: number; color?: string; reveal?: number }> = ({ w, h, seed, color = C.good, reveal = 1 }) => {
  const pts: string[] = [];
  for (let i = 0; i <= 18; i++) {
    const wob = Math.sin(i * 1.7 + seed * 3.1) * 0.12 + Math.sin(i * 0.63 + seed) * 0.08;
    pts.push(`${((i / 18) * w).toFixed(1)},${(h - (0.12 + (i / 18) * 0.75 + wob) * h * 0.85).toFixed(1)}`);
  }
  const len = w * 1.6;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - reveal)} />
    </svg>
  );
};

/**
 * Horizontal motion blur for whip-pans: an SVG blur filter sized by velocity (px/frame).
 * Render `defs` once in the scene and put `filter` on the moving wrapper.
 */
export const useHBlur = (id: string, pxPerFrame: number): [React.ReactNode, string | undefined] => {
  const a = Math.min(60, Math.abs(pxPerFrame));
  if (a < 0.6) return [null, undefined];
  return [
    <svg key={id} width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${a.toFixed(1)} 0`} />
        </filter>
      </defs>
    </svg>,
    `url(#${id})`,
  ];
};

/* ───────── King of the Hill primitives (all deterministic: pure functions of t) ───────── */

/** Pixel-art box with the site's notched 4px ink border and drop shadow. */
export const pxBox = (bg: string, px = 4): React.CSSProperties => ({
  background: bg,
  boxShadow: `0 -${px}px 0 0 ${C.ink}, 0 ${px}px 0 0 ${C.ink}, -${px}px 0 0 0 ${C.ink}, ${px}px 0 0 0 ${C.ink}, 0 ${px * 3}px 0 0 rgba(15,29,58,.28)`,
});

/** White pixel type with a hard ink outline (the site's .px-outline). */
export const outline = (w = 4): React.CSSProperties => ({
  color: "#fff",
  textShadow:
    [[w, 0], [-w, 0], [0, w], [0, -w], [w, w], [-w, w], [w, -w], [-w, -w]].map(([x, y]) => `${x}px ${y}px 0 ${C.ink}`).join(", ") +
    `, 0 ${w * 2.5}px 0 rgba(15,29,58,.3)`,
});

/** Pixel button like the site's .btn-px. */
export const PxButton: React.FC<{ label: React.ReactNode; bg?: string; fg?: string; size?: number; press?: number; style?: React.CSSProperties }> = ({
  label, bg = C.gold, fg = C.ink, size = 34, press = 0, style,
}) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 14, height: size * 2.1, padding: `0 ${size * 0.9}px`,
      fontFamily: PIXEL, fontWeight: 700, fontSize: size, letterSpacing: "0.02em", textTransform: "uppercase", color: fg, background: bg, whiteSpace: "nowrap",
      boxShadow: `0 -5px 0 0 ${C.ink}, 0 5px 0 0 ${C.ink}, -5px 0 0 0 ${C.ink}, 5px 0 0 0 ${C.ink}, inset 0 -8px 0 0 rgba(0,0,0,.22), inset 0 5px 0 0 rgba(255,255,255,.45), 0 ${12 - press * 8}px 0 0 rgba(15,29,58,.3)`,
      transform: `translateY(${press * 6}px)`, filter: press > 0 ? "brightness(.92)" : undefined, ...style,
    }}
  >
    {label}
  </div>
);

const CROWN = ["......K......", ".K...KGK...K.", "KGK.KGRGK.KGK", "KGGKGGGGGKGGK", "KGGGGGGGGGGGK", "KGRGGGRGGGRGK", "KGGGGGGGGGGGK", "KDDDDDDDDDDDK", "KKKKKKKKKKKKK"];
const CROWN_FILL: Record<string, string> = { K: C.goldInk, G: C.gold, R: C.ruby, D: C.goldDk };
export const Crown: React.FC<{ w: number; style?: React.CSSProperties }> = ({ w, style }) => (
  <svg viewBox="0 0 13 9" width={w} height={(w * 9) / 13} shapeRendering="crispEdges" style={style}>
    {CROWN.flatMap((row, y) => [...row].map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={CROWN_FILL[c]} />)))}
  </svg>
);

const CLOUD = ["....WWWW.......", "..WWWWWWWW.WW..", ".WWWWWWWWWWWWW.", "WWWWWWWWWWWWWWW", "SSSSSSSSSSSSSSS"];
export const Cloud: React.FC<{ w: number; style?: React.CSSProperties }> = ({ w, style }) => (
  <svg viewBox="0 0 15 5" width={w} height={(w * 5) / 15} shapeRendering="crispEdges" style={style}>
    {CLOUD.flatMap((row, y) => [...row].map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c === "W" ? C.cloud : "#c0ddfa"} />)))}
  </svg>
);

/** Deterministic 5×5 identicon avatar (fictional challengers). */
export const Ident: React.FC<{ seed: string; size: number }> = ({ seed, size }) => {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const fg = ["#94df50", "#fbd322", "#58b2fa", "#c23729", "#f8ce5e", "#3f9a2c"][h % 6];
  const cells: [number, number][] = [];
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 3; x++)
      if ((h >>> (y * 3 + x)) & 1) {
        cells.push([x, y]);
        if (x < 2) cells.push([4 - x, y]);
      }
  return (
    <svg viewBox="0 0 5 5" width={size} height={size} shapeRendering="crispEdges" style={{ flexShrink: 0 }}>
      <rect width="5" height="5" fill={C.ink} />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fg} />
      ))}
    </svg>
  );
};

/** Square pixel confetti, closed-form in t (beats since the burst). */
export const Confetti: React.FC<{ t: number; seed?: string; n?: number }> = ({ t, seed = "c", n = 170 }) => {
  if (t < 0 || t > 6) return null;
  const secs = t * SPB;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 80 }}>
      {Array.from({ length: n }, (_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const rain = i % 3 === 2;
        const left = i % 2 === 0;
        const delay = rain ? 0.15 + r("d") * 0.7 : r("d") * 0.15;
        const s2 = Math.max(0, secs - delay);
        if (secs < delay) return null;
        let x: number, y: number;
        if (rain) {
          x = r("x") * 1920 + Math.sin(s2 * 3 + r("w") * 6) * 30;
          y = -40 + (300 + r("vy") * 250) * s2 + 60 * s2 * s2;
        } else {
          const vx = (left ? 1 : -1) * (700 + r("vx") * 1000);
          const vy = -(1100 + r("vy") * 900);
          x = (left ? -20 : 1940) + (vx / 1.2) * (1 - Math.exp(-1.2 * s2));
          y = 650 + r("y") * 300 + vy * s2 + 0.5 * 1700 * s2 * s2;
        }
        const size = 10 * (1 + Math.floor(r("s") * 3));
        const flip = Math.abs(Math.cos(s2 * (6 + r("f") * 8) + r("p") * 6));
        const fade = t > 4.6 ? Math.max(0, 1 - (t - 4.6) / 1.4) : 1;
        return (
          <div
            key={i}
            style={{ position: "absolute", left: Math.round(x / 5) * 5, top: Math.round(y / 5) * 5, width: size, height: Math.max(5, Math.round((size * flip) / 5) * 5), background: PALETTE[i % PALETTE.length], opacity: fade }}
          />
        );
      })}
    </div>
  );
};

/** Sky gradient + drifting pixel clouds + sun (deterministic). */
export const Sky: React.FC<{ t: number; sun?: boolean; children?: React.ReactNode }> = ({ t, sun = true, children }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${C.skyTop} 0%, ${C.sky} 45%, ${C.skyLow} 100%)`, overflow: "hidden" }}>
    {sun && (
      <div style={{ position: "absolute", right: 170, top: 90, width: 120, height: 120, background: "#fbfadf", boxShadow: "0 0 0 10px rgba(251,250,223,.45), 0 0 0 22px rgba(251,250,223,.2), 0 0 120px 40px rgba(255,250,223,.35)" }} />
    )}
    <Cloud w={260} style={{ position: "absolute", top: 120, left: ((t * 18 + 200) % 2300) - 300 }} />
    <Cloud w={170} style={{ position: "absolute", top: 300, left: ((t * 11 + 1300) % 2300) - 300, opacity: 0.85 }} />
    <Cloud w={210} style={{ position: "absolute", top: 60, left: ((t * 14 + 800) % 2300) - 300, opacity: 0.8 }} />
    {children}
  </div>
);

/** Pixel timer digits (Jersey 10), like the hero countdown. */
export const Timer: React.FC<{ text: string; size: number; color?: string; style?: React.CSSProperties }> = ({ text, size, color, style }) => (
  <div style={{ fontFamily: DIGITS, fontSize: size, lineHeight: 0.82, letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums", ...outline(Math.max(4, size / 40)), ...(color ? { color } : {}), ...style }}>{text}</div>
);

/** 20-segment progress bar from the hero. */
export const Segments: React.FC<{ filled: number; w: number; color?: string }> = ({ filled, w, color = C.grass }) => (
  <div style={{ display: "flex", gap: 5, width: w }}>
    {Array.from({ length: 20 }, (_, i) => (
      <div key={i} style={{ flex: 1, height: 20, background: i < filled ? color : "rgba(15,29,58,.25)", boxShadow: i < filled ? `inset 0 -5px 0 rgba(0,0,0,.2), 0 0 0 3px ${C.ink}` : "0 0 0 3px rgba(15,29,58,.35)" }} />
    ))}
  </div>
);
