#!/usr/bin/env node
/**
 * Renders src/app/icon.svg (full Signal Tag: shield + NFC) to a transparent PNG.
 * Sharp/librsvg clip to the SVG viewBox; the scaled NFC arcs extend past x=120, so we
 * widen the viewBox only for this export (does not change icon.svg on disk).
 *
 * Usage: node scripts/export-signal-tag-mark-png.mjs [widthPx]
 * Default width: 2048px (height follows viewBox aspect; width tuned so NFC isn’t clipped).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "src", "app", "icon.svg");
const outPath = path.join(root, "public", "reachmasked-signal-tag-mark.png");

/** User units: original art is 120 wide; NFC overflow + ~1% margin on the right (no clip). */
const VIEWBOX_W = 135;
const VIEWBOX_H = 180;

let svg = fs.readFileSync(svgPath, "utf8");
svg = svg.replace(
    /viewBox="0 0 120 180"/,
    `viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}"`,
);

const widthPx = Number(process.argv[2]) || 2048;
const heightPx = Math.round(widthPx * (VIEWBOX_H / VIEWBOX_W));

await sharp(Buffer.from(svg))
    .resize(widthPx, heightPx, { fit: "fill" })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outPath);

console.log(`Wrote ${outPath} (${widthPx}×${heightPx}, RGBA, viewBox ${VIEWBOX_W}×${VIEWBOX_H} export-only)`);
