// Fetch the Natural Earth 1:50m countries TopoJSON (via world-atlas, public
// domain) and save it under public/maps/ so the quiz globe can load it at
// runtime without bundling it into the JS payload.
//
// Run:
//   node scripts/download-europe-map.mjs
//
// Idempotent: overwrites the existing file. Not committed to a build step —
// re-run only when you want to refresh the source data.
//
// 50m gives meaningfully crisper coastlines than 110m at our 480 px globe
// scale; the cost is bundle size, which we tame below by:
//   1. Filtering to ~46 European country geometries.
//   2. Trimming the arcs array down to only those referenced by kept
//      geometries (and renumbering every arc reference).

import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const SOURCE_URL = "https://unpkg.com/world-atlas@2/countries-50m.json";
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
  "528", // Netherlands
  "578", // Norway
  "616", // Poland
  "620", // Portugal
  "642", // Romania
  "643", // Russia (visual mass; far East clipped by the projection anyway)
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

const beforeCount = topo.objects.countries.geometries.length;
topo.objects.countries.geometries = topo.objects.countries.geometries.filter(
  (g) => KEEP.has(String(g.id)),
);
const afterCount = topo.objects.countries.geometries.length;

// ─────────────────────────────────────────────────────────────────────────
// Arc trimming
//
// In TopoJSON, geometries reference shared arcs by index. Negative indices
// mean "reverse that arc" (encoded as ~index, so -1 → arc 0 reversed). After
// filtering geometries we can drop arcs no one references. We must also
// renumber the surviving arcs so all index references stay valid.
// ─────────────────────────────────────────────────────────────────────────

const used = new Set();

// Walk an arbitrarily nested arc-reference structure (Polygon, MultiPolygon,
// LineString, MultiLineString all bottom out at a flat number[]).
function collectFromArcs(arcs) {
  if (!arcs) return;
  if (arcs.length === 0) return;
  if (typeof arcs[0] === "number") {
    for (const ref of arcs) {
      const abs = ref < 0 ? ~ref : ref;
      used.add(abs);
    }
  } else {
    for (const sub of arcs) collectFromArcs(sub);
  }
}

function collectFromGeometry(geom) {
  if (!geom) return;
  if (geom.arcs) collectFromArcs(geom.arcs);
  if (geom.geometries) {
    for (const child of geom.geometries) collectFromGeometry(child);
  }
}

for (const g of topo.objects.countries.geometries) {
  collectFromGeometry(g);
}

// Build the old → new index remap. Sort so spatial locality is preserved
// (gzip compresses contiguous-ish arc data better).
const oldToNew = new Map();
const sortedUsed = [...used].sort((a, b) => a - b);
sortedUsed.forEach((oldIdx, newIdx) => oldToNew.set(oldIdx, newIdx));

function rewriteArcs(arcs) {
  if (!arcs || arcs.length === 0) return;
  if (typeof arcs[0] === "number") {
    for (let i = 0; i < arcs.length; i++) {
      const ref = arcs[i];
      const neg = ref < 0;
      const oldAbs = neg ? ~ref : ref;
      const newAbs = oldToNew.get(oldAbs);
      if (newAbs === undefined) {
        throw new Error(`Arc ${oldAbs} referenced but not in used set`);
      }
      arcs[i] = neg ? ~newAbs : newAbs;
    }
  } else {
    for (const sub of arcs) rewriteArcs(sub);
  }
}

function rewriteGeometry(geom) {
  if (!geom) return;
  if (geom.arcs) rewriteArcs(geom.arcs);
  if (geom.geometries) {
    for (const child of geom.geometries) rewriteGeometry(child);
  }
}

for (const g of topo.objects.countries.geometries) {
  rewriteGeometry(g);
}

const arcsBefore = topo.arcs.length;
topo.arcs = sortedUsed.map((i) => topo.arcs[i]);
const arcsAfter = topo.arcs.length;

// Strip the land outline object we don't render.
if (topo.objects.land) delete topo.objects.land;

const text = JSON.stringify(topo);
writeFileSync(OUT_FILE, text);
console.log(
  `✓ Wrote ${OUT_FILE} (${(text.length / 1024).toFixed(1)} KB, ` +
    `${afterCount} of ${beforeCount} countries, ` +
    `${arcsAfter} of ${arcsBefore} arcs)`,
);
