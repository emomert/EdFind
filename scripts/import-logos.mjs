// Import every university logo described in scripts/logos-manifest.json
// (concatenation of scripts/logos-batch-*.json) into Supabase Storage and
// write the public URL back to universities.logo_url.
//
// Run:
//   node --env-file=.env.local scripts/import-logos.mjs
//
// Behaviour:
//   - Reads scripts/logos-manifest.json (must already exist; written by the
//     research subagents and the merge step below).
//   - For each entry with source_url:
//       * fetch the source bytes
//       * if SVG, upload as-is (vector — already small and crisp)
//       * if raster, resize to fit 256x256 with transparent padding, encode
//         as PNG via sharp, upload
//       * upload to Supabase Storage bucket "university-logos" at
//         "<slug>.<ext>" with upsert: true (re-runnable)
//       * update public.universities.logo_url to the public Storage URL
//   - Entries with source_type === "none" are skipped — UI falls back to
//     initials.
//   - Per-uni failure is logged and counted; the run continues.
//
// Idempotent. Safe to re-run after fixing a few manifest entries.

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import pg from "pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;
if (!url || !serviceKey || !dbUrl) {
  console.error("✗ Missing SUPABASE env vars");
  process.exit(1);
}

const BUCKET = "university-logos";
const MAX_DIM = 256;
const FETCH_TIMEOUT_MS = 15_000;
// Wikimedia returns 429 if we burst — be polite. 500ms between requests + up
// to 3 retries with exponential backoff covers their rate limit cleanly.
const REQUEST_DELAY_MS = 500;
const MAX_FETCH_ATTEMPTS = 4;

const manifestPath = "scripts/logos-manifest.json";
if (!existsSync(manifestPath)) {
  console.error(`✗ Missing ${manifestPath}. Merge the per-batch files first.`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const pgClient = new pg.Client({ connectionString: dbUrl });
await pgClient.connect();

let uploaded = 0;
let skipped = 0;
let failed = 0;
const failures = [];

for (const entry of manifest) {
  const { slug, name, source_url, source_type, image_format } = entry;

  if (source_type === "none" || !source_url) {
    skipped++;
    console.log(`⊙ ${slug} — no source (fallback to initials)`);
    continue;
  }

  try {
    // Throttle requests so Wikimedia doesn't rate-limit us.
    await sleep(REQUEST_DELAY_MS);
    const buf = await fetchWithRetry(source_url);

    // Decide upload format. SVG stays SVG (vector beats anything we'd do
    // with sharp). Raster gets normalised to 256x256 PNG with transparent
    // padding so logos look consistent at any rendered size.
    let uploadBytes;
    let contentType;
    let ext;
    const isSvg =
      image_format === "svg" ||
      /\.svg(\?|$)/i.test(source_url) ||
      looksLikeSvg(buf);

    if (isSvg) {
      uploadBytes = buf;
      contentType = "image/svg+xml";
      ext = "svg";
    } else {
      uploadBytes = await sharp(buf)
        .resize(MAX_DIM, MAX_DIM, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9 })
        .toBuffer();
      contentType = "image/png";
      ext = "png";
    }

    const objectKey = `${slug}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectKey, uploadBytes, {
        contentType,
        cacheControl: "31536000, immutable",
        upsert: true,
      });
    if (upErr) throw new Error(`upload failed: ${upErr.message}`);

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(objectKey);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) throw new Error("getPublicUrl returned nothing");

    await pgClient.query(
      `update public.universities set logo_url = $1 where slug = $2`,
      [publicUrl, slug],
    );

    uploaded++;
    console.log(`✓ ${slug} — ${ext.toUpperCase()} → ${publicUrl}`);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push({ slug, name, error: msg });
    console.error(`✗ ${slug} — ${msg}`);
  }
}

await pgClient.end();

console.log("");
console.log(
  `Done. ${uploaded} uploaded, ${skipped} skipped (no source), ${failed} failed.`,
);
if (failures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
}

function looksLikeSvg(buf) {
  const head = buf.slice(0, 300).toString("utf8").trim().toLowerCase();
  return head.startsWith("<?xml") || head.startsWith("<svg");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(target) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
    try {
      return await fetchOnce(target, FETCH_TIMEOUT_MS);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes("fetch 429");
      const is5xx = /fetch 5\d\d/.test(msg);
      if (!is429 && !is5xx) throw err;
      if (attempt === MAX_FETCH_ATTEMPTS) break;
      // Exponential backoff: 1s, 2s, 4s.
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

async function fetchOnce(target, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(target, {
      signal: ctrl.signal,
      headers: {
        // Many sites (incl. Wikimedia's hot-link rules) need a real UA.
        "User-Agent":
          "EdFindLogoImporter/1.0 (https://ed-find.vercel.app; emomert)",
        Accept: "image/*",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(t);
  }
}
