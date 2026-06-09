# Architecture Decision Records (ADRs)

Each ADR captures one significant architectural choice and the reasoning behind it. ADRs are append-only history — once a decision is accepted, edits should be additive (a follow-up ADR that supersedes the old one), not in-place rewrites.

## When to write one

Write an ADR when you are about to:
- Adopt a new third-party tool or service (database, framework, hosting, AI provider, payments, etc.).
- Replace one of the above with another.
- Make a cross-cutting choice that future contributors would otherwise have to reverse-engineer (auth model, multi-tenancy, schema convention, etc.).

Don't write an ADR for routine implementation choices (file naming, a single component's structure, a one-off helper).

## Naming

`NNNN-kebab-case-title.md`, sequentially numbered. Don't reuse numbers, even for superseded ADRs.

## Template

```markdown
# NNNN — Title

- **Status:** Proposed | Accepted | Superseded by NNNN
- **Date:** YYYY-MM-DD
- **Deciders:** names

## Context

What problem are we solving? What constraints exist?

## Decision

What did we choose, in one or two sentences.

## Alternatives considered

- **Alternative A** — why rejected
- **Alternative B** — why rejected

## Consequences

- **Positive:** what gets easier
- **Negative:** what gets harder
- **Follow-ups:** any specific tasks this decision creates
```

## Index

- [0001 — Tech stack](0001-tech-stack.md)
- [0002 — Database: Supabase Postgres](0002-database-supabase.md)
- [0003 — AI provider abstraction](0003-ai-provider-abstraction.md)
- [0004 — Resend transactional email](0004-resend-transactional-email.md)
- [0005 — Entitlements not on `profiles.tier`](0005-entitlements-not-on-profiles.md) *(Proposed)*
- [0006 — AI rate limiting](0006-ai-rate-limiting.md) *(Proposed)*
