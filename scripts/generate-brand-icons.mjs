// Generates favicon / app-icon assets from the brand mark (logo/logo.png).
//
// Outputs (all consumed automatically by the Next.js App Router):
//   app/icon.png        512x512, transparent, square-padded
//   app/apple-icon.png  180x180, white background (iOS dislikes transparency)
//   app/favicon.ico     multi-size ICO (16/32/48) with PNG-compressed entries
//
// Run after replacing the source logo:  node scripts/generate-brand-icons.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "logo", "logo.png");

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** Square-pad + resize the mark onto a canvas of the given size. */
function squarePng(input, size, background) {
  return sharp(input)
    .resize(size, size, { fit: "contain", background })
    .png()
    .toBuffer();
}

/**
 * Pack PNG buffers into a .ico container. Modern browsers and Windows
 * Vista+ accept PNG-compressed ICO entries, so no BMP conversion needed.
 */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const source = await readFile(SOURCE);

// app/icon.png — served as <link rel="icon"> by Next.js
await writeFile(
  path.join(root, "app", "icon.png"),
  await squarePng(source, 512, TRANSPARENT),
);

// app/apple-icon.png — solid background + breathing room for iOS rounding
const appleInner = await squarePng(source, 140, WHITE);
await writeFile(
  path.join(root, "app", "apple-icon.png"),
  await sharp(appleInner)
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toBuffer(),
);

// app/favicon.ico — legacy /favicon.ico requests
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(
  icoSizes.map(async (size) => ({
    size,
    data: await squarePng(source, size, TRANSPARENT),
  })),
);
await writeFile(path.join(root, "app", "favicon.ico"), buildIco(icoPngs));

console.log("Generated app/icon.png, app/apple-icon.png, app/favicon.ico");
