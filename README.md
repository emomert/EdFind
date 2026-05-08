# EdFind

> Find your best education.

EdFind is a SaaS web app that helps graduating students in Turkey discover and apply to master's programs across Europe. We aggregate scattered program information into one comparable database and use AI to match each student to their best-fit programs.

## Status

**Phase 3 — Database + seed complete.** The repo has the Next.js scaffold, brand tokens, top nav, a working 7-question quiz with localStorage draft persistence, and a Supabase project (eu-west) with the init schema and Politecnico di Milano seed applied. Submitting the quiz still routes to a placeholder results page — the Server Action wiring lands in Phase 4.

See [`docs/architecture.md`](docs/architecture.md) for the phased roadmap.

## Tech stack

- **Next.js 16** (App Router, Turbopack stable) + **TypeScript** — full-stack web app
- **Tailwind CSS** + **shadcn/ui** + **Lucide** — styling and component primitives
- **Supabase** — Postgres, auth, storage, row-level security
- **Vercel** — hosting (web + API routes)
- **DeepSeek** (primary), **OpenAI** (backup) — AI inference, accessed via a provider-agnostic wrapper
- **Stripe** — payments (deferred until pricing tiers go live)

## Project structure

```
EdFindAI/
├── README.md                       you are here
├── CLAUDE.md                       agent brief — read before any session
├── docs/
│   ├── architecture.md             system overview, data flow, deploy topology
│   ├── data-model.md               Postgres schema
│   ├── decisions/                  ADRs (architecture decision records)
│   ├── design/                     brand tokens, component patterns
│   └── features/                   per-feature specs
├── Website UI Design Ver_1.pdf     v1 design reference
├── app/                            Next.js routes (Phase 1+)
├── components/                     (Phase 1+)
├── lib/                            server-only logic, AI client, Supabase clients
├── supabase/
│   ├── migrations/                 timestamped schema migrations
│   └── seed.sql                    seed data (Politecnico di Milano)
├── .env.example                    required env vars (copy to .env.local)
└── package.json
```

## Quickstart

```bash
npm install
cp .env.example .env.local   # then fill in Supabase keys (Phase 3+)
npm run dev                  # http://localhost:3000
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint
npm run build                # production build
```

The quiz lives at `/quiz`. Drafts are saved to `localStorage` under `edfind:quiz_draft:v1`.

### Supabase setup (Phase 3+)

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy the project URL, the `anon` public key, and the `service_role` key from
   _Project Settings → API_ into `.env.local`.
3. Apply the schema. Either:
   - **Dashboard:** open the SQL editor and paste
     `supabase/migrations/20260508120000_init_schema.sql`, then `supabase/seed.sql`.
   - **CLI:** `supabase link --project-ref <ref>` then `supabase db push` and
     `supabase db reset` (or `psql` the seed file).
4. Verify with `node --env-file=.env.local scripts/check-db.mjs`. You should
   see `✓ Phase 3 database is healthy.` along with the seeded Politecnico di
   Milano + MSc Management Engineering rows.

The `service_role` key bypasses RLS — only ever read it from server code
(`lib/supabase/server.ts` enforces this with `import "server-only"`).

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — agent guidance (read this first if you're an AI agent)
- [`docs/architecture.md`](docs/architecture.md) — system overview
- [`docs/data-model.md`](docs/data-model.md) — database schema
- [`docs/design/brand.md`](docs/design/brand.md) — colors, type, voice
- [`docs/decisions/`](docs/decisions/) — architecture decision records
- [`docs/features/`](docs/features/) — feature specs

## License

_TBD_
