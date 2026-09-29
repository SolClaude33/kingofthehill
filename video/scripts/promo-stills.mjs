// QA stills: bundles once, renders the given BEATS (half resolution) to out/promo-stills/.
// Usage: node scripts/promo-stills.mjs [--id=Promo] 2.5 6.8 14.5 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const id = (args.find((a) => a.startsWith("--id=")) ?? "--id=Promo").slice(5);
const beats = args.filter((a) => !a.startsWith("--")).map(Number);
const TL = JSON.parse(readFileSync("src/promo/timeline.json", "utf8"));
const outDir = path.resolve("out/promo-stills");
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const inputProps = { withAudio: false };
const composition = await selectComposition({ serveUrl, id, inputProps });
for (const b of beats) {
  const frame = Math.round(b * (60 / TL.bpm) * TL.fps);
  const output = path.join(outDir, `b${String(b).replace(".", "_")}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, inputProps, imageFormat: "jpeg", jpegQuality: 85, scale: 0.5 });
  console.log(`beat ${b} (frame ${frame}) -> ${output}`);
}
