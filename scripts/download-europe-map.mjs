// Fetch the Natural Earth 1:50m countries TopoJSON (via world-atlas, public
// domain) and save it under public/maps/ so the quiz globe can load it at
// runtime without bundling it into the JS payload.
//
// Run:
//   node scripts/download-europe-map.mjs
//
// Idempotent: overwrites the existing file. Not committed to a build step —
// re-run only when you want to refresh the source data.

import { mkdirSync, writeFileSync, existsSync } from "node:fs";

// 110m (low-detail) is more than enough for a ~400 px globe and roughly
// a quarter the size of 50m. We further trim to European country
// geometries + Turkey below.
const SOURCE_URL = "https://unpkg.com/world-atlas@2/countries-110m.json";
const OUT_DIR = "public/maps";
const OUT_FILE = `${OUT_DIR}/europe.topo.json`;

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

console.log(`→ Fetching ${SOURCE_URL}`);
const res = await fetch(SOURCE_URL);
if (!res.ok) {
  console.error(`✗ HTTP ${res.status}`);
  process.exit(1);
}
const topo = await res.json();

// ISO 3166-1 numeric codes for the European countries we want on the globe.
// Includes Turkey (792) so the audience can orient — they're starting from
// home. Excludes very far edges (Russia east of Urals etc.) by simply
// not listing them.
const KEEP = new Set([
  "008", // Albania
  "020", // Andorra
  "040", // Austria
  "056", // Belgium
  "070", // Bosnia and Herzegovina
  "100", // Bulgaria
  "112", // Belarus
  "191", // Croatia
  "196", // Cyprus
  "203", // Czechia
  "208", // Denmark
  "233", // Estonia
  "246", // Finland
  "250", // France
  "268", // Georgia
  "276", // Germany
  "292", // Gibraltar
  "300", // Greece
  "348", // Hungary
  "352", // Iceland
  "372", // Ireland
  "380", // Italy
  "428", // Latvia
  "438", // Liechtenstein
  "440", // Lithuania
  "442", // Luxembourg
  "470", // Malta
  "498", // Moldova
  "499", // Montenegro
  "492", // Monaco
  "499", // Montenegro (dupe-safe)
  "528", // Netherlands
  "578", // Norway
  "616", // Poland
  "620", // Portugal
  "642", // Romania
  "643", // Russia (kept for visual mass; clipped by projection anyway)
  "674", // San Marino
  "688", // Serbia
  "703", // Slovakia
  "705", // Slovenia
  "724", // Spain
  "752", // Sweden
  "756", // Switzerland
  "792", // Turkey
  "804", // Ukraine
  "807", // North Macedonia
  "826", // United Kingdom
]);

const before = topo.objects.countries.geometries.length;
topo.objects.countries.geometries = topo.objects.countries.geometries.filter(
  (g) => KEEP.has(String(g.id)),
);
const after = topo.objects.countries.geometries.length;
// We deliberately leave the arc array intact — filtering arcs requires
// rewriting every geometry's arc index references. At 110m the arc array is
// already tiny enough that this isn't worth the complexity.

// Trim land/100m boundaries we don't render to save another few KB.
if (topo.objects.land) delete topo.objects.land;

const text = JSON.stringify(topo);
writeFileSync(OUT_FILE, text);
console.log(
  `✓ Wrote ${OUT_FILE} (${(text.length / 1024).toFixed(1)} KB, ${after} of ${before} countries)`,
);
