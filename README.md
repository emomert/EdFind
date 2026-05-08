# EdFind

> Find your best education.

EdFind is a SaaS web app that helps graduating students in Turkey discover and apply to master's programs across Europe. We aggregate scattered program information into one comparable database and use AI to match each student to their best-fit programs.

## Status

**Phase 0 — foundation.** Tech stack and architecture are decided; documentation is being scaffolded. No application code yet.

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
├── lib/                            server-only logic, AI client, Supabase clients (Phase 1+)
├── supabase/                       migrations + seed data (Phase 3+)
└── package.json                    (Phase 1+)
```

## Quickstart

_To be filled in after Phase 1 (Next.js scaffold)._

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — agent guidance (read this first if you're an AI agent)
- [`docs/architecture.md`](docs/architecture.md) — system overview
- [`docs/data-model.md`](docs/data-model.md) — database schema
- [`docs/design/brand.md`](docs/design/brand.md) — colors, type, voice
- [`docs/decisions/`](docs/decisions/) — architecture decision records
- [`docs/features/`](docs/features/) — feature specs

## License

_TBD_
