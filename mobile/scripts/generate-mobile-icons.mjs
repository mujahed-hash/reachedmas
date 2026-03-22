#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, "..");
const repoRoot = path.join(mobileRoot, "..");
const svgPath = path.join(repoRoot, "src", "app", "icon.svg");
const assetsDir = path.join(mobileRoot, "assets");

const DARK_BG = { r: 8, g: 9, b: 10, alpha: 1 };
const LIGHT_BG = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

let svg = fs.readFileSync(svgPath, "utf8");
// Export-only width bump so NFC doesn't clip on rasterizers.
svg = svg.replace(/viewBox="0 0 120 180"/, 'viewBox="0 0 135 180"');

const rendered = await sharp(Buffer.from(svg))
    .resize(2700, 3600, { fit: "fill" })
    .png()
    .toBuffer();

const tightMark = await sharp(rendered).trim().png().toBuffer();

async function renderSquare({ outputPath, canvasSize, markSize, background }) {
    const mark = await sharp(tightMark)
        .resize(markSize, markSize, { fit: "contain" })
        .png()
        .toBuffer();

    await sharp({
        create: {
            width: canvasSize,
            height: canvasSize,
            channels: 4,
            background,
        },
    })
        .composite([{ input: mark, gravity: "center" }])
        .png({ compressionLevel: 9, effort: 10 })
        .toFile(outputPath);

    return mark;
}

await renderSquare({
    outputPath: path.join(assetsDir, "icon.png"),
    canvasSize: 1024,
    markSize: 760,
    background: LIGHT_BG,
});

await renderSquare({
    outputPath: path.join(assetsDir, "icon-dark.png"),
    canvasSize: 1024,
    markSize: 760,
    background: DARK_BG,
});

await renderSquare({
    outputPath: path.join(assetsDir, "splash-icon.png"),
    canvasSize: 1024,
    markSize: 760,
    background: LIGHT_BG,
});

await renderSquare({
    outputPath: path.join(assetsDir, "splash-icon-dark.png"),
    canvasSize: 1024,
    markSize: 760,
    background: DARK_BG,
});

await renderSquare({
    outputPath: path.join(assetsDir, "android-icon-foreground.png"),
    canvasSize: 1024,
    markSize: 700,
    background: TRANSPARENT,
});

await sharp({
    create: {
        width: 512,
        height: 512,
        channels: 4,
        background: DARK_BG,
    },
})
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(assetsDir, "android-icon-background.png"));

const foregroundPng = fs.readFileSync(path.join(assetsDir, "android-icon-foreground.png"));

const alphaRaw = await sharp(foregroundPng)
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer();

await sharp({
    create: {
        width: 1024,
        height: 1024,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
    },
})
    .joinChannel(alphaRaw, {
        raw: { width: 1024, height: 1024, channels: 1 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(assetsDir, "android-icon-monochrome.png"));

await renderSquare({
    outputPath: path.join(assetsDir, "favicon.png"),
    canvasSize: 48,
    markSize: 36,
    background: DARK_BG,
});

// Keep a transparent, landscape logo asset for optional in-app/marketing usage.
const landscapeMark = await sharp(tightMark)
    .resize(620, 620, { fit: "contain" })
    .png()
    .toBuffer();

await sharp({
    create: {
        width: 1376,
        height: 768,
        channels: 4,
        background: TRANSPARENT,
    },
})
    .composite([{ input: landscapeMark, gravity: "center" }])
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(assetsDir, "reachmasked-logo.png"));

console.log("Mobile icon assets regenerated in mobile/assets.");
console.log("- icon.png (light background for iOS light mode)");
console.log("- icon-dark.png (dark background for iOS dark mode)");
console.log("- splash-icon.png (light) + splash-icon-dark.png (dark)");
console.log("- Android adaptive icons (foreground, background, monochrome)");
