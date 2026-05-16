// One-shot helper: dump every university to JSON so the logo-research
// subagent and the importer can work from a stable list. Run with:
//   node --env-file=.env.local scripts/list-unis.mjs > scripts/unis.json
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
const res = await client.query(
  `select slug, name, country, city, website, logo_url
   from public.universities
   order by name`,
);
process.stdout.write(JSON.stringify(res.rows, null, 2));
await client.end();
