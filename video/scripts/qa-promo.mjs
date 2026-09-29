// Post-render QA for the promo (needs ffmpeg/ffprobe on PATH).
// Usage: node scripts/qa-promo.mjs out/promo.mp4
// Writes out/promo-qa/: contact-sheet.jpg, clicks.jpg (frame at every click cue), spectrogram.png, report.txt
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const mp4 = process.argv[2];
if (!mp4) throw new Error("usage: node scripts/qa-promo.mjs <video.mp4>");
const TL = JSON.parse(readFileSync("src/promo/timeline.json", "utf8"));
const SPB = 60 / TL.bpm;
const out = path.resolve("out/promo-qa");
mkdirSync(out, { recursive: true });
const run = (cmd, a) => execFileSync(cmd, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
// ffmpeg reports on stderr, so always return stdout + stderr
const ff = (a) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...a], { encoding: "utf8" });
  return String(r.stdout ?? "") + String(r.stderr ?? "");
};
const lines = [];

// 1. durations: audio must be >= video, video must match the timeline
const probe = run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,duration,r_frame_rate,width,height", "-of", "compact", mp4]);
lines.push("streams:", probe.trim());
const vd = Number(/codec_type=video[^\n]*duration=([\d.]+)/.exec(probe)?.[1]);
const ad = Number(/codec_type=audio[^\n]*duration=([\d.]+)/.exec(probe)?.[1]);
const expected = TL.totalBeats * SPB;
lines.push(`timeline ${expected.toFixed(3)}s · video ${vd}s · audio ${ad}s → ${!ad ? "NO AUDIO STREAM" : ad + 0.02 >= vd ? "audio covers video" : "AUDIO SHORTER THAN VIDEO"}`);

// 2. loudness (target ≈ -14 LUFS integrated, true peak ≤ -1 dBTP)
const eb = ff(["-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-"]);
const I = /I:\s+(-?[\d.]+) LUFS/.exec(eb.split("Summary:").pop() ?? "")?.[1];
const TP = /Peak:\s+(-?[\d.]+) dBFS/.exec(eb.split("Summary:").pop() ?? "")?.[1];
lines.push(`loudness: integrated ${I} LUFS, true peak ${TP} dBTP`);

// 3. contact sheet: ~64 evenly spaced frames
const fps = Math.max(0.2, 64 / vd).toFixed(3);
ff(["-y", "-i", mp4, "-vf", `fps=${fps},scale=320:-1,tile=8x8`, "-frames:v", "1", path.join(out, "contact-sheet.jpg")]);

// 4. frame at every click cue (cursor must be on its target)
const clicks = TL.cues.filter((c) => c.type === "click");
const tmp = path.join(out, "tmp");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);
clicks.forEach((c, i) => {
  const f = Math.round(c.beat * SPB * TL.fps);
  ff(["-y", "-i", mp4, "-vf", `select=eq(n\\,${f}),scale=640:-1`, "-frames:v", "1", path.join(tmp, `c${i}.jpg`)]);
});
if (clicks.length) {
  const cols = Math.min(3, clicks.length);
  ff(["-y", "-i", path.join(tmp, "c%d.jpg"), "-vf", `tile=${cols}x${Math.ceil(clicks.length / cols)}`, "-frames:v", "1", path.join(out, "clicks.jpg")]);
  lines.push(`click frames at beats ${clicks.map((c) => c.beat).join(", ")} → clicks.jpg`);
}
rmSync(tmp, { recursive: true, force: true });

// 5. spectrogram of the track (structure check: intro / drops / breakdown / outro should be visible)
ff(["-y", "-i", mp4, "-lavfi", "showspectrumpic=s=1600x500:legend=1:scale=log:fscale=log", path.join(out, "spectrogram.png")]);

writeFileSync(path.join(out, "report.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
console.log(`\nimages in ${out}: contact-sheet.jpg, clicks.jpg, spectrogram.png`);
