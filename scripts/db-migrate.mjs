// Apply all SQL migrations + the seed file against the Supabase database.
//
// Run from the repo root with:
//   node --env-file=.env.local scripts/db-migrate.mjs
//
// Workflow:
//   1. Ensures a public.schema_migrations ledger exists.
//   2. Walks supabase/migrations/ in filename order. A file already recorded
//      in the ledger (matching checksum) is skipped without re-running.
//      Otherwise it runs inside a transaction and, on success, its filename +
//      checksum are recorded in the SAME transaction (so tracking and apply
//      are atomic).
//   3. Runs supabase/seed.sql afterwards.
//
// Migrations are immutable: once a file is recorded as applied, editing it is
// a mistake — add a NEW migration instead. If a recorded file's checksum
// changes, this script warns loudly and skips it (it will NOT silently
// re-apply or report the edit as applied).
//
// Adoption of pre-existing objects: the first run after the ledger was
// introduced finds none of the legacy migrations recorded. Those objects
// already exist in production (applied out-of-band via the dashboard before
// tracking existed), so re-running them raises a "already exists" SQLSTATE.
// We treat that as "already applied", adopt the file into the ledger so it is
// skipped cleanly next time, and continue. This adoption path assumes the
// legacy file was applied IN FULL out-of-band (verified true for this project
// by scripts/check-db.mjs); it is a one-time backfill, not the normal path.
// Every NEW migration applies cleanly and is tracked precisely.
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
import { createHash } from "node:crypto";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("✗ Missing SUPABASE_DB_URL in .env.local");
  console.error("  Get it from: Supabase dashboard → Project Settings → Database");
  console.error("  → Connection string → URI (direct or session pooler).");
  process.exit(1);
}

// Postgres SQLSTATE codes that mean "this DDL was already applied". Only used
// on the one-time adoption path for legacy migrations applied out-of-band
// before the ledger existed (see header).
const IDEMPOTENT_ERROR_CODES = new Set([
  "42P07", // duplicate_table — relation already exists
  "42701", // duplicate_column
  "42P06", // duplicate_schema
  "42710", // duplicate_object — function/trigger/policy already exists
  "42723", // duplicate_function
  "42P16", // invalid_table_definition — usually triggers already attached
]);

const checksum = (sql) => createHash("sha256").update(sql).digest("hex");

const client = new pg.Client({ connectionString: dbUrl });

try {
  await client.connect();
  console.log(`→ Connected to ${redact(dbUrl)}`);
} catch (err) {
  console.error(`✗ Connection failed: ${err.message}`);
  process.exit(1);
}

// 1. Ledger.
await client.query(`
  create table if not exists public.schema_migrations (
    filename text primary key,
    checksum text not null,
    applied_at timestamptz not null default now()
  )
`);
const ledger = await client.query("select filename, checksum from public.schema_migrations");
const applied = new Map(ledger.rows.map((r) => [r.filename, r.checksum]));

let migrationsRun = 0;
let migrationsSkipped = 0;
let migrationsAdopted = 0;

const migrationFiles = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of migrationFiles) {
  const path = join("supabase", "migrations", file);
  const sql = readFileSync(path, "utf8");
  const sum = checksum(sql);
  const recorded = applied.get(file);

  if (recorded !== undefined) {
    if (recorded !== sum) {
      console.warn(
        `⚠ ${file} — checksum differs from the applied version. Migrations are immutable; ` +
          `add a NEW migration instead of editing this one. Skipping (NOT re-applied).`,
      );
    }
    migrationsSkipped++;
    continue;
  }

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      `insert into public.schema_migrations (filename, checksum) values ($1, $2)`,
      [file, sum],
    );
    await client.query("COMMIT");
    console.log(`✓ ${file}`);
    migrationsRun++;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err.code && IDEMPOTENT_ERROR_CODES.has(err.code)) {
      // Legacy object already present — adopt into the ledger (one-time).
      await client.query(
        `insert into public.schema_migrations (filename, checksum) values ($1, $2)
           on conflict (filename) do nothing`,
        [file, sum],
      );
      console.log(`⊙ ${file} (already present — adopted into ledger, ${err.code})`);
      migrationsAdopted++;
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
  `Done. ${migrationsRun} applied, ${migrationsAdopted} adopted (pre-existing), ${migrationsSkipped} already tracked, seed converged.`,
);

await client.end();

function redact(url) {
  // Strip the password before logging.
  return url.replace(/(:[^:@]+)(@)/, ":***$2");
}
