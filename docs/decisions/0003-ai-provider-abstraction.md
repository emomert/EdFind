# 0003 — AI provider abstraction

- **Status:** Accepted
- **Date:** 2026-05-07
- **Deciders:** Beyza, Claude

## Context

EdFind uses AI inference for several features: the matching engine's reasoning step, the free-text "AI Search" entry path, parsing scraped university data into structured records, and (later) generating application-helper content. The user has working keys for both DeepSeek and OpenAI. AI provider pricing, latency, and quality shift fast — the choice we make today will likely not be the choice we want in twelve months.

Risks:
- Coupling feature code to one provider's SDK makes swapping painful.
- Leaking API keys to the browser is the single biggest cost-and-security risk in this stack.

## Decision

All AI calls go through a thin provider-agnostic wrapper at `lib/ai/index.ts`. Feature code imports from there and calls a stable interface (e.g. `chat({ messages, schema?, model? })`). The wrapper picks the configured provider based on env vars; **DeepSeek is the default**, OpenAI is the configured backup. Every AI call is server-only — Server Action, Route Handler, or Server Component. Keys live in `DEEPSEEK_API_KEY` and `OPENAI_API_KEY` env vars; neither is prefixed `NEXT_PUBLIC_`.

## Alternatives considered

- **Use the OpenAI SDK directly everywhere.** Simplest, well-documented, but couples feature code to OpenAI shapes and makes swapping providers a global refactor. Rejected.
- **Use the Vercel AI SDK / `ai` package as the abstraction.** Solid choice, would also work; mainly defers some of the wrapping work to a community package. We'd still want a thin app-level facade so feature code doesn't import `ai` directly. **May adopt later** if we need streaming UI primitives — at that point the facade stays the same and the Vercel AI SDK becomes an implementation detail behind it.
- **LangChain / LlamaIndex.** Heavier abstractions designed for orchestration we don't need yet. Rejected for MVP.

## Consequences

- **Positive:**
  - Swapping DeepSeek ↔ OpenAI ↔ future providers is a one-file change.
  - One audit point for "is this AI call server-only and rate-limited?"
  - One place to add prompt caching, retries, and observability.
- **Negative:**
  - Feature parity across providers (function calling shapes, JSON-mode behavior, streaming) is uneven; the wrapper has to lowest-common-denominator some features or branch internally.
  - One more layer to maintain.
- **Follow-ups:**
  - When the first AI feature is built, define the wrapper's interface concretely (likely `chat`, `embed`, optionally `generateStructured`).
  - Add a kill-switch env var (`AI_DISABLED=true`) so we can degrade gracefully if a provider is down.
  - When we wire DeepSeek up, the user adds `DEEPSEEK_API_KEY` to local `.env.local` and the Vercel project — the key never travels through chat.
