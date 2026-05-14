// Parses supabase/seed.sql into a JSON catalog the HTML report can embed.
//
// Output: docs/report-data.json  (universities[], programs[])

import { readFileSync, writeFileSync } from "node:fs";

const sql = readFileSync("supabase/seed.sql", "utf8");
const lines = sql.split("\n");

// ─── Universities ────────────────────────────────────────────────────────
// Universities are inserted via multi-row VALUES blocks. Each row spans 8
// lines starting with `  (` and ending with `  ),` or `  )`. We collapse a
// row into a single string and split by top-level commas (commas outside
// quotes), which is good enough since the only commas inside fields are
// inside `'...'` strings.

const universities = [];

let inUniversitiesInsert = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("insert into public.universities")) {
    inUniversitiesInsert = true;
    continue;
  }
  if (inUniversitiesInsert && lines[i].startsWith("on conflict")) {
    inUniversitiesInsert = false;
    continue;
  }
  if (!inUniversitiesInsert) continue;
  if (lines[i].trim() === "(") {
    // Gather lines until we find a line matching `^  \),?\s*$`
    let buf = "";
    let j = i;
    while (j < lines.length && !/^\s*\),?\s*$/.test(lines[j])) {
      buf += lines[j] + " ";
      j++;
    }
    // Final closing line too
    buf += lines[j];
    i = j;

    // Strip leading `  (` and trailing `),` or `)`
    const m = buf.match(/^\s*\((.+)\)\s*,?\s*$/s);
    if (!m) continue;
    const inner = m[1];

    // Split by top-level commas
    const fields = splitTopLevelCommas(inner);
    if (fields.length !== 11) continue; // universities have 11 columns

    const [
      slug,
      name,
      country,
      city,
      institutionType,
      website,
      description,
      establishedYear,
      studentCount,
      qsWorldRank,
      isPartner,
    ] = fields.map((f) => f.trim());

    // Heuristic: rows for universities table all start with a slug like
    // 'politecnico-di-milano' (lowercase, hyphenated). Skip rows that
    // don't look like a uni slug (these would be from other inserts —
    // there shouldn't be any, but be safe).
    if (!/^'[a-z0-9-]+'$/.test(slug)) continue;

    universities.push({
      slug: unquote(slug),
      name: unquote(name),
      country: unquote(country),
      city: unquote(city),
      institutionType: unquote(institutionType),
      website: unquote(website),
      description: unquote(description),
      establishedYear: parseIntOrNull(establishedYear),
      studentCount: parseIntOrNull(studentCount),
      qsWorldRank: parseIntOrNull(qsWorldRank),
      isPartner: isPartner.trim() === "true",
    });
  }
}

// ─── Programs ────────────────────────────────────────────────────────────
// Each program is its own `insert into public.programs (...) select u.id,
// ..., from public.universities u where u.slug = '<uni>' on conflict ...;`
// block. We scan for the `insert into public.programs` header, then read
// the next ~10 fields off the canonical layout.

const programs = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith("insert into public.programs")) continue;

  // The `select u.id,` line is at i+5 (after the header + columns + closing
  // paren + opening "select" — actually it's i+5 in this layout).
  // We'll scan forward for the `select u.id,` line.
  let sel = -1;
  for (let j = i; j < Math.min(i + 12, lines.length); j++) {
    if (lines[j].trim().startsWith("select u.id,")) {
      sel = j;
      break;
    }
  }
  if (sel < 0) continue;

  // Layout from `select u.id,`:
  //   sel+0: select u.id,
  //   sel+1:   'slug',
  //   sel+2:   'name',
  //   sel+3:   'degree', 'field_of_study', 'language',
  //   sel+4:   duration_months, tuition_per_year, 'currency', deadline, 'start_month',
  //   sel+5:   'description',
  //   sel+6+:  jsonb_build_object(...) — multi-line
  //   sel+N-1: qs_subject_rank, qs_subject_area
  //   sel+N:   from public.universities u where u.slug = '<uni>'

  const slug = unquote(lines[sel + 1].trim().replace(/,$/, ""));
  const name = unquote(lines[sel + 2].trim().replace(/,$/, ""));

  const degLine = splitTopLevelCommas(lines[sel + 3]);
  const numLine = splitTopLevelCommas(lines[sel + 4]);
  if (degLine.length < 3 || numLine.length < 5) continue;
  const degree = unquote(degLine[0].trim());
  const fieldOfStudy = unquote(degLine[1].trim());
  const language = unquote(degLine[2].trim());

  const durationMonths = parseIntOrNull(numLine[0].trim());
  const tuitionPerYear = parseFloatOrNull(numLine[1].trim());
  const currency = unquote(numLine[2].trim());
  const deadline = parseDeadline(numLine[3].trim());
  const startMonth = unquote(numLine[4].trim());

  // Find the `from public.universities u where u.slug = '<uni>'` line.
  let uniSlug = null;
  for (let j = sel + 5; j < Math.min(sel + 40, lines.length); j++) {
    const m = lines[j].match(/where u\.slug = '([^']+)'/);
    if (m) {
      uniSlug = m[1];
      break;
    }
  }
  if (!uniSlug) continue;

  programs.push({
    universitySlug: uniSlug,
    slug,
    name,
    degree,
    fieldOfStudy,
    language,
    durationMonths,
    tuitionPerYear,
    currency,
    applicationDeadline: deadline,
    startMonth,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function splitTopLevelCommas(s) {
  const out = [];
  let buf = "";
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'") {
      // Handle '' escape
      if (s[i + 1] === "'") {
        buf += c + c;
        i++;
        continue;
      }
      inStr = !inStr;
      buf += c;
    } else if (c === "," && !inStr) {
      out.push(buf);
      buf = "";
    } else {
      buf += c;
    }
  }
  if (buf.length) out.push(buf);
  return out;
}

function unquote(s) {
  s = s.trim();
  if (s === "null") return null;
  const m = s.match(/^'(.*)'$/s);
  if (!m) return s;
  return m[1].replace(/''/g, "'");
}

function parseIntOrNull(s) {
  s = s.trim();
  if (s === "null") return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

function parseFloatOrNull(s) {
  s = s.trim();
  if (s === "null") return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function parseDeadline(s) {
  s = s.trim();
  if (s === "null") return null;
  const m = s.match(/^date '([^']+)'$/);
  return m ? m[1] : null;
}

// ─── Write output ────────────────────────────────────────────────────────

const out = { universities, programs };
writeFileSync("docs/report-data.json", JSON.stringify(out, null, 2), "utf8");
console.log(
  `Wrote docs/report-data.json — ${universities.length} universities, ${programs.length} programs`,
);
