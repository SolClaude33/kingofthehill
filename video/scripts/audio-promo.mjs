// Soundtrack for the promo: arrangement driven by timeline.json "music.sections" + every SFX cue.
// Default style: warm tech-pop / nu-disco (vi–IV–I–V in D major, octave bass, sidechained pads, pluck arp, marimba hook).
// Change the style by editing CHORDS / MELODY / the section renderers below, not the engine (synth.mjs).
// Output: public/promo/audio/promo.wav → mastered by the "audio:promo" npm script to promo-master.wav.
import { readFileSync } from "node:fs";
import { createMix } from "./synth.mjs";

const TL = JSON.parse(readFileSync("src/promo/timeline.json", "utf8"));
const M = TL.music ?? { sections: [] };
const X = M.transpose ?? 0; // semitones; transpose the whole track to another key
const mix = createMix({ bpm: TL.bpm, totalBeats: TL.totalBeats, seed: M.seed ?? 20260926 });
const { B } = mix;

// 4-bar cycle starting at beat 0 (so phrases line up with the storyboard's 4-beat grid).
const CHORDS = [
  { pad: [57, 62, 66, 71], root: 35, keys: [59, 62, 66, 69] }, // Bm7
  { pad: [59, 62, 66, 67], root: 31, keys: [55, 59, 62, 66] }, // Gmaj7
  { pad: [57, 62, 64, 66], root: 38, keys: [57, 62, 64, 66] }, // Dadd9
  { pad: [57, 61, 64, 69], root: 33, keys: [57, 61, 64, 69] }, // A
].map((c) => ({ pad: c.pad.map((m) => m + X), root: c.root + X, keys: c.keys.map((m) => m + X) }));
const TONIC = { pad: [50, 57, 62, 64, 66, 73].map((m) => m + X), keys: [62, 66, 69, 73, 76].map((m) => m + X), root: 26 + X };
// [beat offset inside the 16-beat cycle, MIDI note]
const MELODY = [
  [0, 78], [0.75, 81], [1.5, 83], [2.5, 81], [3, 78],
  [4.5, 74], [5, 76], [5.5, 78], [6.5, 76], [7, 74],
  [8, 81], [8.75, 78], [9.5, 76], [10, 74], [10.5, 76], [11.5, 78],
  [12, 76], [13.5, 73], [14, 76], [14.5, 81],
].map(([o, m]) => [o, m + X]);
const chordAt = (beat) => CHORDS[Math.floor(beat / 4) % 4];

function grooveBar(b0, { kick = true, bass = true, arp = true, keys = false, shaker = 1 } = {}) {
  const ch = chordAt(b0);
  for (let q = 0; q < 4; q++) {
    const b = b0 + q;
    if (kick) mix.kick(B(b));
    if (q % 2 === 1) mix.clap(B(b), 0.9);
    mix.hat(B(b + 0.5), 0.85, true, 0.25);
    for (let s = 0; s < 4; s++) mix.shaker(B(b + s * 0.25), [0.55, 0.25, 0.85, 0.3][s] * shaker);
  }
  if (bass) for (let e = 0; e < 8; e++) mix.bass(B(b0 + e * 0.5), ch.root + (e % 2 ? 12 : 0), B(0.3), e % 2 ? 0.75 : 1);
  mix.pad(B(b0), ch.pad, B(4), { cut: 2300, att: 0.04, rel: 0.25, vel: 0.85 });
  if (arp) {
    const tones = [...ch.pad].sort((a, b) => a - b).map((m) => m + 12);
    [0, 1, 2, 3, 2, 1, 3, 2].forEach((ix, e) => mix.pluck(B(b0 + e * 0.5), tones[ix], e % 2 ? 0.7 : 1, e % 2 ? 0.35 : -0.35));
  }
  if (keys) {
    mix.keys(B(b0 + 1.5), ch.keys, B(0.35), 0.8);
    mix.keys(B(b0 + 3.5), ch.keys, B(0.35), 0.65);
  }
}

const bars = (from, to, fn) => {
  for (let b = from; b < to; b += 4) fn(b, Math.min(4, to - b));
};

const RENDER = {
  // filtered pad opening up + heartbeat sub + light ticks (tension under a hook / problem statement)
  intro: ({ from, to }) => {
    const len = to - from;
    bars(from, to, (b, n) => {
      const k0 = (b - from) / len, k1 = (b + n - from) / len;
      mix.pad(B(b), chordAt(b).pad, B(n), { cut: 320 + 1700 * k0, cutEnd: 320 + 1700 * k1, att: b === from ? 1.2 : 0.2, rel: 0.5, vel: 1.1 });
    });
    for (let b = from; b < to; b++) {
      mix.bass(B(b), chordAt(b).root, B(0.2), 0.4);
      if (b > from) mix.hat(B(b + 0.5), 0.35, false, 0.3);
      if (b > from + 1) mix.hat(B(b), 0.22, false, -0.3);
    }
  },
  // one bar that swells into a drop: bright chords, clap/hat roll in the last 2 beats
  build: ({ from, to }) => {
    mix.kick(B(from));
    mix.crash(B(from), 0.7);
    mix.bass(B(from), chordAt(from).root + 3, B(1.8), 0.9);
    mix.pad(B(from), chordAt(from).pad, B(to - from), { cut: 2600, cutEnd: 3400, att: 0.02, rel: 0.3 });
    mix.keys(B(from), chordAt(from).keys, B(1.5), 1);
    for (let s = 0; s < 8; s++) {
      mix.clap(B(to - 2 + s * 0.25), 0.25 + s * 0.08);
      mix.hat(B(to - 2 + s * 0.25), 0.3 + s * 0.07, false, 0);
    }
  },
  // four-on-the-floor groove; options: keys, melody, noKick (e.g. while a loader spins)
  groove: ({ from, to, keys, melody, noKick, prevKind }) => {
    if (prevKind !== "groove") mix.crash(B(from), 0.9);
    bars(from, to, (b) => grooveBar(b, { keys, kick: !noKick, bass: !noKick, shaker: noKick ? 0.6 : 1 }));
    if (melody)
      for (let c = Math.floor(from / 16) * 16; c < to; c += 16)
        MELODY.forEach(([o, m], i) => {
          const b = c + o;
          if (b >= from && b < to) mix.mallet(B(b), m, 1, i % 2 ? 0.15 : -0.15);
        });
  },
  // drums out; one chord stab + bass hit per beat (pairs with one-word-per-beat visuals)
  breakdown: ({ from, to }) => {
    for (let b = from; b < to; b++) {
      const ch = chordAt(b);
      mix.keys(B(b), ch.keys.concat(ch.keys[0] + 12), B(0.7), 1.1);
      mix.bass(B(b), ch.root, B(0.45), 1);
    }
    mix.pad(B(from), chordAt(from).pad, B(to - from), { cut: 900, att: 0.3, rel: 0.4, vel: 0.7 });
  },
  // short pre-drop: hit, swell, accelerating clap roll
  lift: ({ from, to }) => {
    mix.kick(B(from));
    mix.bass(B(from), chordAt(from).root, B(1.2), 1);
    mix.pad(B(from), chordAt(from).pad, B(to - from), { cut: 1200, cutEnd: 4200, att: 0.05, rel: 0.2, vel: 0.95 });
    const half = (to - from) / 2;
    for (let s = 0; s < half * 2; s++) mix.clap(B(from + half - 1 + s * 0.5), 0.35 + s * 0.05);
    for (let s = 0; s < 8; s++) mix.clap(B(to - 1 + s * 0.125), 0.5 + s * 0.06);
  },
  // land on the tonic and ring out (logo / end card)
  outro: ({ from }) => {
    mix.kick(B(from), 1.1);
    mix.crash(B(from), 1);
    mix.bass(B(from), TONIC.root, B(4), 1);
    mix.keys(B(from), TONIC.keys, B(3), 1.1);
    mix.pad(B(from), TONIC.pad, B(5), { cut: 2600, cutEnd: 900, att: 0.02, rel: 1.4, vel: 1.1 });
    mix.mallet(B(from + 1), TONIC.keys[0] + 24, 0.6, 0.2);
  },
};

let prevKind = null;
for (const s of M.sections) {
  if (!RENDER[s.kind]) throw new Error(`unknown music section kind "${s.kind}"`);
  RENDER[s.kind]({ ...s, prevKind });
  prevKind = s.kind;
}
mix.applyTimeline(TL, { popBase: 74 + X, chimeBase: 74 + X });
mix.render("public/promo/audio/promo.wav", { fadeBeats: M.fadeBeats ?? 5 });
