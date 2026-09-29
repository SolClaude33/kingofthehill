// King of the Hill promo — one component per timeline scene. All times are LOCAL beats.
import React from "react";
import { Img, staticFile } from "remotion";
import TL from "./timeline.json";
import {
  BODY, C, Confetti, Crown, Cursor, DIGITS, E, Fill, Glow, Ident, PIXEL, Plane, PxButton, Rise, Segments, Sky, Timer,
  lerp, outline, pr, pxBox, springAt, tw, typed, useBeat, useHBlur,
} from "./lib";

const img = (f: string) => staticFile(`promo/${f}`);

/* Art sizes (px) */
const MTN = { w: 3040, h: 5376 }; // mountain-full: croc crown at ~0.26%, feet ~6.9%, mine entrance at the bottom
const BD = { w: 2688, h: 1520 }; // backdrop: distant range + forested hills
const LOGO = { w: 1200, h: 450 }; // wordmark with the croc

/* Fictional challengers (never real GMGN handles) */
const CHALLENGERS = [
  { name: "CroakDaddy", handle: "croakdaddy", text: "Not so fast." },
  { name: "moonpepe", handle: "moonpepe", text: "I'm taking this hill." },
  { name: "BNB Whale", handle: "bnbwhale", text: "Crown looks better on me." },
  { name: "GatorGang", handle: "gatorgang", text: "LFG, my turn." },
  { name: "swampqueen", handle: "swampqueen", text: "Hold my BNB." },
  { name: "LizardLord", handle: "lizardlord", text: "Called it first." },
];

/** Hero-style king card (site component, rebuilt). */
const KingCard: React.FC<{ name: string; handle: string; text: string; crowned?: boolean; label?: string; w?: number; crownDrop?: number }> = ({
  name, handle, text, crowned = false, label, w = 620, crownDrop = 1,
}) => (
  <div style={{ position: "relative", width: w, padding: "34px 30px 26px", ...pxBox(crowned ? C.gold : C.parchment, 5), fontFamily: BODY, color: C.ink }}>
    <div style={{ position: "absolute", left: 26, top: -24, background: C.ink, color: C.gold, fontFamily: PIXEL, fontWeight: 700, fontSize: 20, letterSpacing: "0.2em", padding: "6px 14px", textTransform: "uppercase" }}>
      {label ?? (crowned ? "Crowned king" : "Current king")}
    </div>
    <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <Crown w={64} style={{ position: "absolute", left: 12, top: -44 - (1 - crownDrop) * 80, transform: "rotate(-8deg)", opacity: Math.min(1, crownDrop * 3) }} />
        <div style={{ boxShadow: `0 0 0 5px ${C.ink}` }}>
          <Ident seed={handle} size={92} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 40, lineHeight: 1 }}>{name}</div>
        <div style={{ fontSize: 22, color: C.inkSoft, marginTop: 6 }}>@{handle}</div>
      </div>
    </div>
    <div style={{ marginTop: 22, borderLeft: `6px solid ${C.ink}`, paddingLeft: 18, fontSize: 30 }}>“{text}”</div>
  </div>
);

/* 1 · Hook: the clock almost runs out… then a call out resets it */
export const Hook: React.FC = () => {
  const t = useBeat();
  const reset = t >= 4;
  const n = Math.max(1, 4 - Math.floor(t));
  const digits = reset ? "05:00" : `00:0${n}`;
  const shake = !reset ? Math.sin(t * 60) * (t % 1 < 0.3 ? 6 : 0) * (n <= 2 ? 1 : 0.4) : 0;
  const flip = springAt(t, 4, 12, 0.45);
  const slam = springAt(t, 3.75, 13, 0.5);
  const lift = pr(t, 4.9, 5.6, E.expo);
  const out = pr(t, 7.5, 8, E.in);
  const flash = reset ? Math.max(0, 1 - (t - 4) / 0.5) : 0;
  return (
    <Fill bg={C.ink}>
      <Glow y="120%" a={0.18} rgb="251,211,34" />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 - out * 0.9})`, opacity: 1 - out }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: lerp(250, 150, lift), textAlign: "center" }}>
          <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 34, letterSpacing: "0.22em", color: reset ? C.gold : "#fff", textTransform: "uppercase", ...(reset ? {} : outline(3)) }}>
            {reset ? "Clock reset" : "Time left on the hill"}
          </div>
          <div style={{ display: "inline-block", marginTop: 20, transform: `translateX(${shake}px) scale(${reset ? 0.6 + flip * 0.4 : 1 + (t % 1 < 0.15 ? 0.04 : 0)})` }}>
            <Timer text={digits} size={330} color={reset ? "#fff" : n <= 2 ? C.gold : "#fff"} />
          </div>
        </div>
        {/* the call out that saves the day */}
        <div style={{ position: "absolute", left: lerp(2100, 1230, Math.min(1, slam)), top: lerp(600, 520, lift), transform: `rotate(${lerp(8, -3, Math.min(1, slam))}deg)`, opacity: t >= 3.75 ? 1 : 0 }}>
          <KingCard name="CroakDaddy" handle="croakdaddy" text="Not so fast." label="New call out" w={600} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", fontFamily: PIXEL, fontWeight: 700, fontSize: 84, ...outline(5) }}>
          <Rise t={t} at={5} style={{ marginRight: "0.25em" }}>Every</Rise>
          <Rise t={t} at={5.18} style={{ marginRight: "0.25em" }}>call</Rise>
          <Rise t={t} at={5.36} style={{ marginRight: "0.25em" }}>out</Rise>
          <Rise t={t} at={5.54} style={{ marginRight: "0.25em", color: C.gold }}>resets</Rise>
          <Rise t={t} at={5.72} style={{ marginRight: "0.25em" }}>the</Rise>
          <Rise t={t} at={5.9}>clock.</Rise>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: C.gold, opacity: flash * 0.55, mixBlendMode: "screen" }} />
    </Fill>
  );
};

/* 2 · Logo: circle reveal into the sky, wordmark drops with a spring */
export const Logo: React.FC = () => {
  const t = useBeat();
  const r = tw(t, 0, 0.55, 0, 1250, E.out);
  const drop = springAt(t, 0.15, 10, 0.42);
  const hills = pr(t, 0, 1.2, E.expo);
  return (
    <Fill bg={C.ink}>
      <div style={{ position: "absolute", inset: 0, clipPath: `circle(${r}px at 50% 50%)` }}>
        <Sky t={t + 20} />
        <Img src={img("backdrop-2688.webp")} style={{ position: "absolute", width: 2600, left: -340, top: 1080 - 1470 * 0.72 + (1 - hills) * 300 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 170 + (1 - drop) * -520, display: "flex", justifyContent: "center", transform: `scale(${tw(t, 0, 4, 1, 1.05, E.inOut)})` }}>
          <Img src={img("logo-wordmark-1200.webp")} style={{ width: 1400, height: (1400 * LOGO.h) / LOGO.w, filter: "drop-shadow(0 12px 0 rgba(15,29,58,.3))" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: PIXEL, fontWeight: 700, fontSize: 64, ...outline(5) }}>
          <Rise t={t} at={1.3} style={{ marginRight: "0.25em" }}>Last</Rise>
          <Rise t={t} at={1.45} style={{ marginRight: "0.25em" }}>call</Rise>
          <Rise t={t} at={1.6} style={{ marginRight: "0.25em" }}>out</Rise>
          <Rise t={t} at={1.75} style={{ marginRight: "0.25em" }}>takes</Rise>
          <Rise t={t} at={1.9} style={{ marginRight: "0.25em" }}>the</Rise>
          <Rise t={t} at={2.05} style={{ color: C.gold }}>crown.</Rise>
        </div>
      </div>
    </Fill>
  );
};

/* 3 · Climb: camera rises up the mountain from the mine to the crowned croc */
export const Climb: React.FC = () => {
  const t = useBeat();
  const W = 2500;
  const H = (W * MTN.h) / MTN.w;
  const up = pr(t, 0.2, 6.6, E.inOut);
  const top = lerp(1080 - H + 120, 330, up); // end with sky above the croc
  const zoom = tw(t, 5.5, 8, 1, 1.18, E.inOut);
  const fullRow = top + 0.372 * H;
  const bdW = 3000;
  const bdH = (bdW * BD.h) / BD.w;
  return (
    <Fill bg={C.skyTop}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 42%" }}>
        <Sky t={t + 40} sun={false} />
        <Img src={img("backdrop-2688.webp")} style={{ position: "absolute", width: bdW, left: (1920 - bdW) / 2, top: fullRow + 60 - bdH }} />
        <Img src={img("mountain-full-3040.webp")} style={{ position: "absolute", width: W, height: H, left: (1920 - W) / 2, top }} />
      </div>
      <div style={{ position: "absolute", left: 110, top: 110, fontFamily: PIXEL, fontWeight: 700, fontSize: 30, letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase", textShadow: `3px 3px 0 ${C.ink}`, opacity: pr(t, 0.4, 1) * (1 - pr(t, 3.6, 4)) }}>
        From the mine to the summit
      </div>
      <div style={{ position: "absolute", left: 110, top: 160, fontFamily: PIXEL, fontWeight: 700, fontSize: 96, lineHeight: 1, ...outline(6), opacity: 1 - pr(t, 3.6, 4) }}>
        <div><Rise t={t} at={0.6}>The challengers</Rise></div>
        <div><Rise t={t} at={0.85}>are climbing.</Rise></div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: PIXEL, fontWeight: 700, fontSize: 88, ...outline(6) }}>
        <Rise t={t} at={5.2} style={{ marginRight: "0.25em" }}>One</Rise>
        <Rise t={t} at={5.4} style={{ marginRight: "0.25em" }}>hill.</Rise>
        <Rise t={t} at={5.8} style={{ marginRight: "0.25em" }}>One</Rise>
        <Rise t={t} at={6} style={{ color: C.gold }}>king.</Rise>
      </div>
    </Fill>
  );
};

/** Dark mine backdrop for the step scenes, with the step header. */
const MineStage: React.FC<{ t: number; n: string; title: string; children: React.ReactNode }> = ({ t, n, title, children }) => (
  <Fill bg={C.mine}>
    <Img src={img("mine-1920.webp")} style={{ position: "absolute", width: 1920 * 1.1, left: -96 + t * -8, top: -40, filter: "brightness(.45) saturate(1.1)" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 60% at 50% 55%, rgba(20,10,4,.15), rgba(20,10,4,.7))" }} />
    <div style={{ position: "absolute", left: 110, top: 80, zIndex: 100 }}>
      <div style={{ fontFamily: DIGITS, fontSize: 64, color: C.gold, textShadow: `4px 4px 0 ${C.mine}` }}>
        {n} <span style={{ color: "rgba(255,246,220,.45)" }}>/ 03</span>
      </div>
      <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 78, lineHeight: 1, ...outline(5) }}>
        <Rise t={t} at={0.05} dur={0.5}>{title}</Rise>
      </div>
    </div>
    {children}
  </Fill>
);

/* 4 · Step 01: grab the token */
export const Step1: React.FC = () => {
  const t = useBeat();
  const clickAt = 2.2;
  const done = t >= clickAt + 0.15;
  const press = Math.abs(t - clickAt) < 0.25 ? 1 - Math.abs(t - clickAt) / 0.25 : 0;
  const toBtn = pr(t, 0.8, 2, E.inOut);
  return (
    <MineStage t={t} n="01" title="Grab the token">
      <Plane w={1000} h={520} fx={lerp(420, 640, toBtn)} fy={lerp(250, 400, toBtn)} s={lerp(1.0, 1.18, toBtn) * tw(t, 0, 0.5, 1.12, 1, E.out)} sx={lerp(960, 1040, toBtn)} sy={lerp(720, 790, toBtn)} rx={lerp(8, 4, toBtn)} ry={lerp(-10, 6, toBtn)}>
        <div style={{ position: "absolute", inset: 0, padding: 44, ...pxBox(C.parchment, 6), opacity: pr(t, 0, 0.3), fontFamily: BODY, color: C.ink }}>
          <div style={{ fontFamily: DIGITS, fontSize: 110, lineHeight: 0.8, color: C.goldDk }}>$KING</div>
          <div style={{ marginTop: 26, fontSize: 30, lineHeight: 1.45, maxWidth: 860 }}>Pick up $KING on Flap. Every trade pays a small fee, and those fees are the prize.</div>
          <div style={{ position: "absolute", left: 44, bottom: 50 }}>
            <PxButton label={done ? "✓ You're in" : "Buy on Flap ↗"} bg={done ? C.grass : C.gold} size={36} press={press} />
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, transform: "translateZ(60px)" }}>
          <Cursor x={lerp(760, 250, toBtn)} y={lerp(160, 432, toBtn) - Math.sin(toBtn * Math.PI) * 50} t={t} clicks={[clickAt]} scale={1.2} opacity={pr(t, 0.3, 0.6)} />
        </div>
      </Plane>
    </MineStage>
  );
};

/* 5 · Step 02: post a call out → you become the king, the clock resets */
export const Step2: React.FC = () => {
  const t = useBeat();
  const start = TL.scenes.step2[0];
  const msg = typed("callout", start + t);
  const clickAt = 4;
  const press = Math.abs(t - clickAt) < 0.25 ? 1 - Math.abs(t - clickAt) / 0.25 : 0;
  const toBtn = pr(t, 2.9, 3.8, E.inOut);
  const swap = pr(t, 4.35, 4.85, E.expo); // composer slides away, hero HUD slams in
  const crown = springAt(t, 4.9, 10, 0.4);
  return (
    <Fill bg={C.mine}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform: `translateX(${-swap * 1920}px)` }}>
        <MineStage t={t} n="02" title="Call it out on GMGN">
          <Plane w={1000} h={520} fx={lerp(470, 800, toBtn)} fy={lerp(250, 430, toBtn)} s={lerp(1.0, 1.18, toBtn) * tw(t, 0, 0.5, 1.12, 1, E.out)} sx={lerp(960, 1060, toBtn)} sy={lerp(720, 800, toBtn)} rx={lerp(8, 4, toBtn)} ry={lerp(10, -6, toBtn)}>
            <div style={{ position: "absolute", inset: 0, padding: 40, ...pxBox(C.parchment, 6), opacity: pr(t, 0, 0.3), fontFamily: BODY, color: C.ink }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ boxShadow: `0 0 0 4px ${C.ink}` }}>
                  <Ident seed="you" size={64} />
                </div>
                <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 34 }}>Call out $KING</div>
              </div>
              <div style={{ marginTop: 28, height: 180, background: "#fff", boxShadow: `0 0 0 4px ${C.ink}`, padding: "22px 24px", fontSize: 38 }}>
                {msg.text}
                <span style={{ display: "inline-block", width: 4, height: 38, background: C.ink, marginLeft: 4, verticalAlign: "-6px", opacity: Math.floor(t * 2) % 2 === 0 && t < clickAt ? 1 : 0 }} />
              </div>
              <div style={{ position: "absolute", right: 40, bottom: 44 }}>
                <PxButton label="Call out" size={34} press={press} />
              </div>
            </div>
            <div style={{ position: "absolute", inset: 0, transform: "translateZ(60px)" }}>
              <Cursor x={lerp(520, 816, toBtn)} y={lerp(300, 440, toBtn) - Math.sin(toBtn * Math.PI) * 50} t={t} clicks={[clickAt]} scale={1.2} opacity={pr(t, 0.3, 0.6)} />
            </div>
          </Plane>
        </MineStage>
      </div>
      {/* the site's hero reacts */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform: `translateX(${(1 - swap) * 1920}px)` }}>
        <Sky t={t + 60} />
        <Img src={img("backdrop-2688.webp")} style={{ position: "absolute", width: 2600, left: -340, top: 1080 - 1470 * 0.5 }} />
        <div style={{ position: "absolute", left: 130, top: 190 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ ...pxBox(C.ruby, 4), color: "#fff", fontFamily: PIXEL, fontWeight: 700, fontSize: 22, letterSpacing: "0.2em", padding: "4px 12px" }}>● LIVE</div>
            <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 28, letterSpacing: "0.16em", ...outline(3) }}>TIME LEFT ON THE HILL</div>
          </div>
          <div style={{ marginTop: 20, transform: `scale(${t >= 4.5 ? 1 + Math.max(0, 1 - (t - 4.5) / 0.4) * 0.12 : 1})`, transformOrigin: "left center" }}>
            <Timer text="05:00" size={300} />
          </div>
          <div style={{ marginTop: 26 }}>
            <Segments filled={20} w={620} />
          </div>
        </div>
        <div style={{ position: "absolute", right: 150, top: 330, transform: `translateY(${(1 - Math.min(1, springAt(t, 4.6, 12, 0.5))) * -80}px)` }}>
          <KingCard name="You" handle="you" text={msg.full} crownDrop={Math.min(1.2, crown)} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontFamily: PIXEL, fontWeight: 700, fontSize: 70, ...outline(5) }}>
          <Rise t={t} at={5.4} style={{ marginRight: "0.25em" }}>You're</Rise>
          <Rise t={t} at={5.58} style={{ marginRight: "0.25em" }}>the</Rise>
          <Rise t={t} at={5.76} style={{ color: C.gold }}>king.</Rise>
        </div>
      </div>
    </Fill>
  );
};

/* 6 · Step 03: hold the hill until 00:00 → crowned, confetti */
export const Step3: React.FC = () => {
  const t = useBeat();
  const crowned = t >= 4;
  const left = Math.max(0, 3 - Math.floor(t));
  const shake = !crowned ? Math.sin(t * 70) * (t % 1 < 0.28 ? 7 : 0) : 0;
  const banner = springAt(t, 4.05, 12, 0.45);
  return (
    <Fill bg={C.sky}>
      <Sky t={t + 70} />
      <Img src={img("backdrop-2688.webp")} style={{ position: "absolute", width: 2600, left: -340, top: 1080 - 1470 * 0.5 }} />
      <div style={{ position: "absolute", left: 110, top: 80, zIndex: 100, opacity: 1 - pr(t, 3.9, 4.1) }}>
        <div style={{ fontFamily: DIGITS, fontSize: 64, color: C.gold, textShadow: `4px 4px 0 ${C.ink}` }}>
          03 <span style={{ color: "rgba(255,255,255,.7)" }}>/ 03</span>
        </div>
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 78, lineHeight: 1, ...outline(5) }}>
          <Rise t={t} at={0.05} dur={0.5}>Hold the hill</Rise>
        </div>
      </div>
      <div style={{ position: "absolute", left: 130, top: 340, opacity: crowned ? 0.95 : 1 }}>
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 28, letterSpacing: "0.16em", color: crowned ? C.gold : "#fff", textShadow: `3px 3px 0 ${C.ink}` }}>
          {crowned ? "KING CROWNED · NEXT ROUND IN" : "5 MINUTES, NO NEW CALL OUT…"}
        </div>
        <div style={{ marginTop: 16, transform: `translateX(${shake}px)` }}>
          <Timer text={crowned ? "01:00" : `00:0${left}`} size={300} color={!crowned && left <= 1 ? C.gold : "#fff"} />
        </div>
        <div style={{ marginTop: 24 }}>
          <Segments filled={crowned ? 20 : Math.max(0, 3 - Math.floor(t)) * 2} w={620} color={C.gold} />
        </div>
      </div>
      <div style={{ position: "absolute", right: 150, top: 440 }}>
        <KingCard name="You" handle="you" text="LFG, this hill is mine" crowned={crowned} label={crowned ? "Crowned king · round 1" : "Current king"} />
      </div>
      {crowned && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", zIndex: 90 }}>
          <div style={{ ...pxBox(C.gold, 6), padding: "26px 56px 30px", textAlign: "center", transform: `scale(${lerp(2.2, 1, Math.min(1.1, banner))}) rotate(-2deg)`, opacity: Math.min(1, banner * 2) }}>
            <Crown w={120} style={{ marginTop: -86 }} />
            <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 76, color: C.ink, textTransform: "uppercase", whiteSpace: "nowrap" }}>New king crowned!</div>
          </div>
        </div>
      )}
      <Confetti t={t - 4} seed="crown" />
    </Fill>
  );
};

/* 7 · Beat words */
const WORDS = ["Call out.", "Hold.", "Crown.", "Repeat."];
export const Words: React.FC = () => {
  const t = useBeat();
  const i = Math.min(WORDS.length - 1, Math.floor(t));
  const tt = t - i;
  const k = pr(tt, 0, 0.22, E.expo);
  return (
    <Fill bg={C.ink}>
      <Glow x={i % 2 ? "82%" : "18%"} y="110%" a={0.2} rgb="251,211,34" />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", transform: `scale(${(1.28 - 0.28 * k) * (1 + tt * 0.04)})`, filter: k < 0.98 ? `blur(${((1 - k) * 16).toFixed(1)}px)` : undefined, opacity: Math.min(1, tt / 0.08) }}>
        <div style={{ textAlign: "center" }}>
          {i === 2 && <Crown w={170} style={{ marginBottom: 10 }} />}
          <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 250, ...outline(8), color: i === 2 ? C.gold : "#fff" }}>{WORDS[i]}</div>
        </div>
      </div>
    </Fill>
  );
};

/* 8 · The trail: whip-pans across challengers; the crown hops to each new caller */
export const Trail: React.FC = () => {
  const t = useBeat();
  const gap = 760;
  // centre index: whips at local 0, 2, 4, 6 (with the whoosh cues)
  const c = (x: number) => {
    let v = tw(x, 0, 0.55, -0.9, 0, E.whip);
    for (let k = 1; k <= 3; k++) v += pr(x, k * 2, k * 2 + 0.5, E.whip);
    return v;
  };
  const dt = 1 / 28;
  const vel = ((c(t + dt) - c(t - dt)) / 2) * gap; // px per frame
  const [defs, filter] = useHBlur("trailblur", vel);
  const W = 2500;
  const H = (W * MTN.h) / MTN.w;
  const cx = c(t);
  return (
    <Fill bg={C.grass}>
      <Img src={img("mountain-full-3040.webp")} style={{ position: "absolute", width: W, height: H, left: (1920 - W) / 2 - cx * 90, top: -H * 0.55, filter: "brightness(.85)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,29,58,.55), rgba(15,29,58,.1) 40%, rgba(15,29,58,.35))" }} />
      {defs}
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", zIndex: 5 }}>
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 30, letterSpacing: "0.22em", color: C.gold, textShadow: `3px 3px 0 ${C.ink}` }}>2,000M · THE SLOPES</div>
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 84, ...outline(5), marginTop: 8 }}>
          <Rise t={t} at={0.2}>Every call out knocks the king off.</Rise>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, filter, perspective: 2200 }}>
        {CHALLENGERS.slice(0, 5).map((p, i) => {
          const off = i - cx;
          const x = 960 + off * gap;
          if (Math.abs(off) > 2) return null;
          const crownAt = [1.5, 3.5, 5.5, 7.5][i - 0];
          const isKing = crownAt !== undefined && t >= crownAt && (i === 3 ? true : t < [3.5, 5.5, 7.5, 99][i]);
          const drop = crownAt !== undefined ? springAt(t, crownAt, 11, 0.42) : 0;
          return (
            <div key={p.handle} style={{ position: "absolute", left: x - 330, top: 470, transform: `scale(1.25) rotateY(${off * -16}deg) translateZ(${-Math.abs(off) * 180}px)`, opacity: 1 - Math.min(0.5, Math.abs(off) * 0.35) }}>
              <KingCard name={p.name} handle={p.handle} text={p.text} crowned={isKing} label={isKing ? "Current king" : "Challenger"} w={660} crownDrop={isKing ? Math.min(1.2, drop) : 0} />
            </div>
          );
        })}
      </div>
    </Fill>
  );
};

/* 9 · Hall of Kings: tombs rise in the crypt */
const KINGS = [
  { name: "CroakDaddy", handle: "croakdaddy", round: 1 },
  { name: "BNB Whale", handle: "bnbwhale", round: 2 },
  { name: "swampqueen", handle: "swampqueen", round: 3 },
];
export const Hall: React.FC = () => {
  const t = useBeat();
  return (
    <Fill bg={C.crypt}>
      <Img src={img("crypt-1920.webp")} style={{ position: "absolute", width: 2100, left: -90 + t * -10, top: -60, filter: "brightness(.62)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,12,24,.55), rgba(10,12,24,.15) 45%, rgba(10,12,24,.7))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
        <Crown w={90} style={{ transform: "rotate(-6deg)" }} />
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 30, letterSpacing: "0.22em", color: C.gold, textShadow: "3px 3px 0 #000", marginTop: 10 }}>400M · THE CRYPT OF KINGS</div>
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 120, lineHeight: 1, ...outline(6), marginTop: 6 }}>
          <Rise t={t} at={0.2}>Hall of Kings</Rise>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", gap: 56 }}>
        {KINGS.map((k, i) => {
          const up = springAt(t, 1.5 + i, 11, 0.5);
          return (
            <div key={k.handle} style={{ width: 460, transform: `translateY(${(1 - Math.min(1.05, up)) * 380}px)`, opacity: t >= 1.5 + i ? 1 : 0 }}>
              <div style={{ position: "relative", padding: "44px 30px 30px", textAlign: "center", background: "linear-gradient(180deg,#4a4f6a,#363a52)", boxShadow: `0 -6px 0 0 #0d0f1c, 0 6px 0 0 #0d0f1c, -6px 0 0 0 #0d0f1c, 6px 0 0 0 #0d0f1c, 0 20px 0 0 rgba(0,0,0,.4)` }}>
                <div style={{ position: "absolute", left: "50%", top: -26, transform: "translateX(-50%)", background: "#8f1d22", color: C.gold, fontFamily: PIXEL, fontWeight: 700, fontSize: 22, letterSpacing: "0.18em", padding: "6px 16px", boxShadow: "0 0 0 4px #0d0f1c", whiteSpace: "nowrap" }}>
                  ROUND {k.round}
                </div>
                <Crown w={80} style={{ transform: `translateY(${(1 - Math.min(1, springAt(t, 1.8 + i, 12, 0.45))) * -60}px) rotate(-8deg)` }} />
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <div style={{ boxShadow: `0 0 0 5px ${C.gold}, 0 0 0 10px ${C.goldInk}` }}>
                    <Ident seed={k.handle} size={96} />
                  </div>
                </div>
                <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 40, color: C.gold, marginTop: 20 }}>{k.name}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: PIXEL, fontWeight: 700, fontSize: 56, ...outline(4), opacity: pr(t, 4.6, 5.2) }}>
        Hold the hill for 5 minutes and the fees are <span style={{ color: C.gold }}>yours.</span>
      </div>
    </Fill>
  );
};

/* 10 · CTA: the summit, the rule, and a click that floods the frame gold */
export const Cta: React.FC = () => {
  const t = useBeat();
  const clickAt = 6;
  const press = Math.abs(t - clickAt) < 0.25 ? 1 - Math.abs(t - clickAt) / 0.25 : 0;
  const toBtn = pr(t, 4.4, 5.6, E.inOut);
  const flood = pr(t, 6.25, 7.6, E.in);
  const W = 2300;
  const H = (W * MTN.h) / MTN.w;
  return (
    <Fill bg={C.gold}>
      <Sky t={t + 90} />
      <Img src={img("mountain-full-3040.webp")} style={{ position: "absolute", width: W, height: H, left: (1920 - W) / 2, top: 400 + tw(t, 0, 8, 40, 0, E.out), transform: `scale(${tw(t, 0, 8, 1.05, 1)})`, transformOrigin: "50% 10%" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center" }}>
        <div style={{ fontFamily: DIGITS, fontSize: 240, lineHeight: 0.85, ...outline(7) }}>
          <Rise t={t} at={0.2}>5:00</Rise>
        </div>
        <div style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: 84, ...outline(6), marginTop: 10 }}>
          <Rise t={t} at={1} style={{ marginRight: "0.25em" }}>Last</Rise>
          <Rise t={t} at={1.2} style={{ marginRight: "0.25em" }}>call</Rise>
          <Rise t={t} at={1.4} style={{ marginRight: "0.25em" }}>out</Rise>
          <Rise t={t} at={1.6} style={{ color: C.gold }}>wins.</Rise>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 840, display: "flex", justifyContent: "center", transform: `scale(${springAt(t, 2.4, 10, 0.5) || 0.001})` }}>
        <PxButton label="Call out on GMGN ↗" size={44} press={press} />
      </div>
      <Cursor x={lerp(1500, 1010, toBtn)} y={lerp(980, 890, toBtn) - Math.sin(toBtn * Math.PI) * 60} t={t} clicks={[clickAt]} scale={1.4} opacity={pr(t, 4.2, 4.5)} />
      <div style={{ position: "absolute", left: 960, top: 886, width: 0, height: 0 }}>
        <div style={{ position: "absolute", left: -1300 * flood, top: -1300 * flood, width: 2600 * flood, height: 2600 * flood, borderRadius: "50%", background: C.gold }} />
      </div>
    </Fill>
  );
};

/* 11 · End card: the gold collapses into the sky, logo + URL */
export const End: React.FC = () => {
  const t = useBeat();
  const r = tw(t, 0, 0.8, 1400, 0, E.expo);
  const drop = springAt(t, 0.35, 10, 0.45);
  const url = pr(t, 1.3, 2, E.expo);
  return (
    <Fill bg={C.skyTop}>
      <Sky t={t + 110} />
      <Img src={img("backdrop-2688.webp")} style={{ position: "absolute", width: 2600, left: -340, top: 1080 - 1470 * 0.9 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150 + (1 - Math.min(1, drop)) * -300, display: "flex", justifyContent: "center", transform: `scale(${tw(t, 0, 8, 1, 1.04, E.inOut)})` }}>
        <Img src={img("logo-wordmark-1200.webp")} style={{ width: 1300, height: (1300 * LOGO.h) / LOGO.w, filter: "drop-shadow(0 12px 0 rgba(15,29,58,.3))" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", opacity: url, transform: `translateY(${(1 - url) * 30}px)` }}>
        <div style={{ ...pxBox(C.parchment, 5), padding: "18px 38px", fontFamily: PIXEL, fontWeight: 700, fontSize: 58, color: C.ink }}>kingofthehillbnb.fun</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 850, textAlign: "center", fontFamily: PIXEL, fontWeight: 700, fontSize: 52, ...outline(4) }}>
        <Rise t={t} at={2}>Last call out takes the crown.</Rise>
      </div>
      <Confetti t={t - 0.2} seed="end" n={90} />
      <div style={{ position: "absolute", left: 960, top: 886, width: 0, height: 0, zIndex: 100 }}>
        <div style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: "50%", background: C.gold }} />
      </div>
    </Fill>
  );
};

