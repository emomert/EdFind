// Apply all SQL migrations + the seed file against the Supabase database.
//
// Run from the repo root with:
//   node --env-file=.env.local scripts/db-migrate.mjs
//
// Workflow:
//   1. Walks supabase/migrations/ in filename order, runs each migration
//      inside a transaction.
//   2. Runs supabase/seed.sql afterwards.
//
// Idempotency: schema migrations may have been applied previously via the
// dashboard SQL editor. Postgres errors that mean "this DDL already exists"
// (relations, columns, indexes, functions) are treated as already-applied
// and the migration is skipped without failing the run. Anything else is a
// real error and aborts.
//
// Seed file uses ON CONFLICT DO UPDATE — re-running converges existing rows
// to whatever the file currently says.
//
// Requires SUPABASE_DB_URL in .env.local. Get it from:
//   Supabase dashboard → Project Settings → Database → Connection string
//   → URI mode (use the direct connection or session pooler — NOT the
//   transaction pooler, which doesn't support DDL).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("✗ Missing SUPABASE_DB_URL in .env.local");
  console.error("  Get it from: Supabase dashboard → Project Settings → Database");
  console.error("  → Connection string → URI (direct or session pooler).");
  process.exit(1);
}

// Postgres SQLSTATE codes that mean "this DDL was already applied". When a
// migration uses bare CREATE TABLE / ALTER TABLE ADD COLUMN (no IF NOT EXISTS),
// re-running it produces these errors — safe to swallow at the migration
// level since we're not in a partial-apply state.
const IDEMPOTENT_ERROR_CODES = new Set([
  "42P07", // duplicate_table — relation already exists
  "42701", // duplicate_column
  "42P06", // duplicate_schema
  "42710", // duplicate_object — function/trigger/policy already exists
  "42723", // duplicate_function
  "42P16", // invalid_table_definition — usually triggers already attached
]);

const client = new pg.Client({ connectionString: dbUrl });

try {
  await client.connect();
  console.log(`→ Connected to ${redact(dbUrl)}`);
} catch (err) {
  console.error(`✗ Connection failed: ${err.message}`);
  process.exit(1);
}

let migrationsRun = 0;
let migrationsSkipped = 0;

const migrationFiles = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of migrationFiles) {
  const path = join("supabase", "migrations", file);
  const sql = readFileSync(path, "utf8");

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`✓ ${file}`);
    migrationsRun++;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err.code && IDEMPOTENT_ERROR_CODES.has(err.code)) {
      console.log(`⊙ ${file} (already applied — ${err.code})`);
      migrationsSkipped++;
    } else {
      console.error(`✗ ${file}`);
      console.error(`  ${err.code ?? ""} ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }
}

console.log("");
console.log(`→ Applying supabase/seed.sql`);
const seedSql = readFileSync("supabase/seed.sql", "utf8");
try {
  await client.query("BEGIN");
  await client.query(seedSql);
  await client.query("COMMIT");
  console.log(`✓ seed.sql`);
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(`✗ seed.sql`);
  console.error(`  ${err.code ?? ""} ${err.message}`);
  await client.end();
  process.exit(1);
}

console.log("");
console.log(
  `Done. ${migrationsRun} migration${migrationsRun === 1 ? "" : "s"} applied, ${migrationsSkipped} already present, seed converged.`,
);

await client.end();

function redact(url) {
  // Strip the password before logging.
  return url.replace(/(:[^:@]+)(@)/, ":***$2");
}
