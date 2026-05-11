// One-off patcher: applies verifier-produced corrections to supabase/seed.sql.
//
// Each fix names a (university_slug, program_slug, field, new_value).
// We locate the matching INSERT block in seed.sql by scanning for the program
// slug line and confirming the `where u.slug = '<uni>'` line that follows.
// Then we patch the specific field in place.
//
// The DELETE list removes whole INSERT blocks for programs that don't exist.
//
// Run from repo root:
//   node scripts/apply-verifier-fixes.mjs
//
// After it succeeds, run scripts/db-migrate.mjs to push the changes to Supabase.

import { readFileSync, writeFileSync } from "node:fs";

const UPDATES = [
  // A — UK + IE
  { uni: "london-business-school", prog: "msc-analytics-and-management", field: "start_month", value: "August" },
  { uni: "london-business-school", prog: "msc-financial-analysis", field: "start_month", value: "August" },

  // B — DACH
  { uni: "wu-vienna", prog: "msc-information-systems", field: "start_month", value: "October" },
  { uni: "wu-vienna", prog: "msc-marketing", field: "start_month", value: "October" },
  { uni: "eth-zurich", prog: "msc-architecture", field: "duration_months", value: 24 },
  { uni: "eth-zurich", prog: "msc-architecture", field: "language", value: "de" },
  { uni: "eth-zurich", prog: "msc-computer-science", field: "application_deadline", value: "2026-04-30" },
  { uni: "eth-zurich", prog: "msc-mechanical-engineering", field: "tuition_per_year", value: 4380.00 },
  { uni: "eth-zurich", prog: "msc-mechanical-engineering", field: "application_deadline", value: "2026-04-30" },
  { uni: "geneva-graduate-institute", prog: "ma-master-in-development-studies", field: "application_deadline", value: "2026-04-15" },
  { uni: "geneva-graduate-institute", prog: "master-in-international-affairs-mia", field: "application_deadline", value: "2026-04-15" },
  { uni: "geneva-graduate-institute", prog: "msc-master-in-international-economics", field: "application_deadline", value: "2026-04-15" },
  { uni: "ludwig-maximilian-university-of-munich", prog: "ma-eastern-european-studies", field: "language", value: "de" },
  { uni: "rwth-aachen-university", prog: "msc-automotive-engineering", field: "duration_months", value: 18 },
  { uni: "technical-university-of-munich", prog: "msc-management-and-technology", field: "tuition_per_year", value: 8000.00 },

  // C — Nordics + Baltics + CEE
  { uni: "charles-university", prog: "ma-european-politics-and-society", field: "tuition_per_year", value: 9000 },
  { uni: "ntnu", prog: "msc-globalisation-and-sustainable-development", field: "tuition_per_year", value: 26445 },
  { uni: "ntnu", prog: "msc-globalisation-and-sustainable-development", field: "name", value: "MSc in Global Relations and Sustainable Development" },
  { uni: "ntnu", prog: "msc-industrial-ecology", field: "tuition_per_year", value: 205600 },
  { uni: "ntnu", prog: "msc-marine-technology", field: "tuition_per_year", value: 205600 },
  { uni: "ntnu", prog: "msc-sustainable-energy", field: "tuition_per_year", value: 205600 },
  { uni: "lund-university", prog: "msc-finance", field: "duration_months", value: 12 },
  { uni: "lund-university", prog: "msc-finance", field: "tuition_per_year", value: 160000 },
  { uni: "stockholm-school-of-economics", prog: "msc-finance", field: "tuition_per_year", value: 180000 },

  // D — BNL + FR
  { uni: "escp-business-school", prog: "msc-in-finance", field: "tuition_per_year", value: 25440.00 },

  // E — Southern (IT/ES/PT)
  { uni: "iese-business-school", prog: "master-in-management", field: "tuition_per_year", value: 52000 },
  { uni: "universidad-carlos-iii-de-madrid", prog: "master-in-finance", field: "tuition_per_year", value: 13500 },
  { uni: "universitat-pompeu-fabra", prog: "ma-political-philosophy", field: "tuition_per_year", value: 5750 },
  { uni: "university-of-bologna", prog: "msc-computer-science", field: "language", value: "it" },
  { uni: "nova-school-of-business-and-economics", prog: "master-in-business-analytics", field: "duration_months", value: 18 },
];

const DELETES = [
  { uni: "university-of-oslo", prog: "ma-european-international-relations" },
];

const path = "supabase/seed.sql";
let lines = readFileSync(path, "utf8").split("\n");

const sqlEscape = (s) => s.replace(/'/g, "''");

// Locate a program's INSERT block in `lines`. Returns the index of the
// `'<prog>',` line, or -1 if no block matches both slugs.
function findBlock(lines, uniSlug, progSlug) {
  const progLine = `  '${progSlug}',`;
  const uniLineFragment = `where u.slug = '${uniSlug}'`;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== progLine) continue;
    // Look ahead up to ~30 lines for the matching `where u.slug = '<uni>'`.
    for (let j = i; j < Math.min(i + 35, lines.length); j++) {
      if (lines[j].includes(uniLineFragment)) return i;
    }
  }
  return -1;
}

// Find the end of an INSERT block (the line ending with `;`) starting from the
// `'<prog>',` line. We walk forward looking for the first standalone `;` line.
function findBlockEnd(lines, startIdx) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].endsWith(";")) return i;
  }
  return -1;
}

function patchLine(line, field, value) {
  switch (field) {
    case "language": {
      // Last 2-letter quoted code on the line, optional trailing comma.
      return line.replace(/'[a-z]{2}'(,?\s*)$/, `'${value}'$1`);
    }
    case "degree": {
      // First quoted token on the line.
      return line.replace(/^(\s*)'[^']+'/, `$1'${value}'`);
    }
    case "field_of_study": {
      // Middle quoted token: `  'DEG', 'FIELD', 'LANG',`
      return line.replace(/^(\s*'[^']+', )'[^']+'/, `$1'${value}'`);
    }
    case "duration_months": {
      // First number on the line.
      return line.replace(/^(\s*)\d+(?:\.\d+)?/, `$1${value}`);
    }
    case "tuition_per_year": {
      // Second numeric value. Preserve .00 if integer-ish.
      const formatted =
        Number.isInteger(value) ? `${value}.00` : value.toFixed(2);
      return line.replace(
        /^(\s*\d+(?:\.\d+)?, )(\d+(?:\.\d+)?)/,
        `$1${formatted}`,
      );
    }
    case "currency": {
      // First quoted on a line that begins `<num>, <num>,`
      return line.replace(
        /^(\s*\d+(?:\.\d+)?, \d+(?:\.\d+)?, )'[^']+'/,
        `$1'${value}'`,
      );
    }
    case "application_deadline": {
      const replacement = value === null ? "null" : `date '${value}'`;
      return line.replace(
        /^(\s*\d+(?:\.\d+)?, \d+(?:\.\d+)?, '[^']+', )(null|date '[^']+')/,
        `$1${replacement}`,
      );
    }
    case "start_month": {
      return line.replace(/'[A-Za-z]+'(,?\s*)$/, `'${value}'$1`);
    }
    default:
      throw new Error(`Unknown field: ${field}`);
  }
}

function applyUpdate(lines, fix) {
  const blockIdx = findBlock(lines, fix.uni, fix.prog);
  if (blockIdx < 0) {
    console.error(`✗ NOT FOUND: ${fix.uni} / ${fix.prog}`);
    return false;
  }

  if (fix.field === "name") {
    // Replace the next line entirely (it's the program-name line).
    const oldLine = lines[blockIdx + 1];
    lines[blockIdx + 1] = `  '${sqlEscape(fix.value)}',`;
    console.log(
      `✓ ${fix.uni}/${fix.prog} :: name → ${fix.value}`,
    );
    return true;
  }

  // Field/lang/degree are on line +2; numeric/currency/deadline/start on line +3.
  const onLine2 = ["degree", "field_of_study", "language"].includes(fix.field);
  const lineIdx = onLine2 ? blockIdx + 2 : blockIdx + 3;
  const before = lines[lineIdx];
  const after = patchLine(before, fix.field, fix.value);
  if (before === after) {
    console.warn(
      `! NO CHANGE: ${fix.uni}/${fix.prog} :: ${fix.field} → ${fix.value} (line unchanged)`,
    );
    return false;
  }
  lines[lineIdx] = after;
  console.log(`✓ ${fix.uni}/${fix.prog} :: ${fix.field} → ${fix.value}`);
  return true;
}

function applyDelete(lines, fix) {
  const blockIdx = findBlock(lines, fix.uni, fix.prog);
  if (blockIdx < 0) {
    console.error(`✗ DELETE NOT FOUND: ${fix.uni} / ${fix.prog}`);
    return null;
  }
  // Walk back to find the start of the insert block (the `insert into ...` or
  // the leading `-- <comment>` line).
  let startIdx = blockIdx;
  while (startIdx > 0) {
    const prev = lines[startIdx - 1];
    if (prev.startsWith("insert into") || prev.startsWith("-- ")) {
      startIdx -= 1;
    } else {
      break;
    }
  }
  // Walk further back to swallow a single preceding comment line if present.
  if (startIdx > 0 && lines[startIdx - 1].startsWith("-- ")) {
    startIdx -= 1;
  }
  const endIdx = findBlockEnd(lines, blockIdx);
  if (endIdx < 0) {
    console.error(`✗ DELETE end-of-block not found for ${fix.prog}`);
    return null;
  }
  console.log(
    `✓ DELETE ${fix.uni}/${fix.prog} :: lines ${startIdx + 1}–${endIdx + 1}`,
  );
  // Splice the range out, plus any single trailing blank line.
  let removeCount = endIdx - startIdx + 1;
  if (lines[endIdx + 1] === "") removeCount += 1;
  lines.splice(startIdx, removeCount);
  return { startIdx, removeCount };
}

console.log(`→ Applying ${UPDATES.length} updates`);
let updatesApplied = 0;
for (const fix of UPDATES) {
  if (applyUpdate(lines, fix)) updatesApplied += 1;
}
console.log(`→ Applying ${DELETES.length} deletes`);
let deletesApplied = 0;
for (const fix of DELETES) {
  if (applyDelete(lines, fix)) deletesApplied += 1;
}

writeFileSync(path, lines.join("\n"), "utf8");
console.log("");
console.log(
  `Done. Wrote ${path}. Updates applied: ${updatesApplied}/${UPDATES.length}. Deletes applied: ${deletesApplied}/${DELETES.length}.`,
);
