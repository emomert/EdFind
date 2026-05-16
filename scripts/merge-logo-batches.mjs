// Concatenate scripts/logos-batch-*.json into scripts/logos-manifest.json
// after the four research subagents finish.
//
//   node scripts/merge-logo-batches.mjs

import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const files = readdirSync("scripts")
  .filter((f) => /^logos-batch-\d+\.json$/.test(f))
  .sort();

if (files.length === 0) {
  console.error("✗ No logos-batch-*.json files found in scripts/");
  process.exit(1);
}

const merged = [];
for (const f of files) {
  const data = JSON.parse(readFileSync(`scripts/${f}`, "utf8"));
  if (!Array.isArray(data)) {
    console.error(`✗ scripts/${f} is not a JSON array`);
    process.exit(1);
  }
  merged.push(...data);
  console.log(`  ${f}: ${data.length} entries`);
}

writeFileSync(
  "scripts/logos-manifest.json",
  JSON.stringify(merged, null, 2) + "\n",
);

const stats = {
  total: merged.length,
  wikimedia: merged.filter((e) => e.source_type === "wikimedia").length,
  clearbit: merged.filter((e) => e.source_type === "clearbit").length,
  official: merged.filter((e) => e.source_type === "official").length,
  none: merged.filter((e) => e.source_type === "none").length,
};
console.log("");
console.log(`Merged ${merged.length} entries → scripts/logos-manifest.json`);
console.log(
  `  wikimedia=${stats.wikimedia} clearbit=${stats.clearbit} official=${stats.official} none=${stats.none}`,
);
