# EdFind

> Find your best education.

EdFind is a SaaS web app that helps graduating students in Turkey discover and apply to master's programs across Europe. We aggregate scattered program information into one comparable database and use AI to match each student to their best-fit programs.

## Status

**MVP shipped.** Live at **https://ed-find.vercel.app/**, hosted on Vercel, backed by Supabase (eu-west). The full end-to-end works in production: 13-question profile quiz (or AI free-text search) → Server Action → Supabase profile + match → personalized results page. Real submissions verified on launch day (2026-05-08).

Live features beyond the original MVP: Google sign-in (required for `/quiz`, `/search`, `/results*`, `/shortlist`, `/applications`, `/compare`), shortlist + side-by-side compare, application tracker with task kanban, community pages, public `/catalog` browse, and a header command-palette search. Catalog covers **58 universities / 196 programs across 15 European countries**. Matching runs on **DeepSeek V4 Flash** (`deepseek-v4-flash`). What's next: Stripe / tier billing, Turkish localization.

See [`docs/architecture.md`](docs/architecture.md) for the phased roadmap.

## Live

- **Production:** https://ed-find.vercel.app/
- **Repo:** https://github.com/emomert/EdFind

## Tech stack

- **Next.js 16** (App Router, Turbopack stable) + **TypeScript** — full-stack web app
- **Tailwind CSS** + **shadcn/ui** + **Lucide** — styling and component primitives
- **Supabase** — Postgres, auth, storage, row-level security
- **Vercel** — hosting (web + API routes)
- **DeepSeek V4 Flash** — AI inference, accessed via a provider-agnostic wrapper (`lib/ai/`). The wrapper is OpenAI-compatible, but no second provider is wired today (aspirational)
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
3. Add the Postgres connection URL too: _Project Settings → Database →
   Connection string → URI_, paste into `SUPABASE_DB_URL` in `.env.local`.
   Use the direct connection or session pooler URL — **not** the transaction
   pooler (port 6543), which rejects schema-changing statements.
4. Apply migrations and seed in one command:

   ```bash
   node --env-file=.env.local scripts/db-migrate.mjs
   ```

   The script walks `supabase/migrations/` in filename order, runs each one
   in a transaction (skipping the ones already applied), then runs
   `supabase/seed.sql` (which is upsert-based, so re-running converges
   existing rows to the file).
5. Verify with `node --env-file=.env.local scripts/check-db.mjs`. You should
   see counts matching what the seed inserted.

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
