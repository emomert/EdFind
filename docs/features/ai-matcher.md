# AI matcher

Replaces the Phase-4 placeholder ("Polimi MSc Management Engineering for everyone") with a real ranked-top-3 matcher backed by DeepSeek V4 Flash. Shipped 2026-05-08.

## What it does

When a student submits the profile quiz (or a free-text query via `/search`):

1. `lib/server/persist-and-match.ts` persists the profile against the authenticated `user_id`.
2. It loads the entire program catalog (currently **197 programs across 58 universities** in 15 European countries) joined to university metadata.
3. It calls `matchProgramsToProfile` in `lib/ai/index.ts`, which sends the profile + compressed catalog to **DeepSeek V4 Flash** (`deepseek-v4-flash`) with `response_format: { type: "json_object" }`.
4. The model returns a ranked top-3 with `program_id`, `score` (0–100), and a 70–130-word `rationale` per match.
5. All three matches are inserted into `matches` with their scores and rationales.
6. The action redirects the client to `/results/[matchId]` for the **highest-scoring** match.

Both the matcher and the free-text query parser go through `lib/ai/client.ts`, which adds a 25s timeout (configurable via `AI_TIMEOUT_MS`), one retry on 5xx/timeout, and an `AI_DISABLED=true` env kill switch.

## Where the code lives

| File | Role |
|---|---|
| `lib/ai/index.ts` | DeepSeek client, prompt construction, response validation. `import "server-only"`. |
| `app/quiz/actions.ts` | `submitProfile` Server Action. Loads catalog, calls matcher, writes matches, sets cookie. |
| `app/results/[matchId]/page.tsx` | Renders the top match as a hero plus other matches as compact cards (loaded by `profile_id`, ordered by score desc). |
| `scripts/smoke-deepseek.mjs` | Sanity check: verifies `DEEPSEEK_API_KEY` works against `deepseek-v4-flash`. Run with `node --env-file=.env.local scripts/smoke-deepseek.mjs`. |

## Model choice

DeepSeek V4 Flash, released 2026-04-24:

- Model id: `deepseek-v4-flash`
- 284B MoE / 13B active parameters, 1M-token context
- Pricing ≈ $0.14/M input, $0.28/M output
- OpenAI-compatible Chat Completions API at `https://api.deepseek.com/v1/chat/completions`
- **Mandatory:** the legacy `deepseek-chat` and `deepseek-reasoner` endpoints retire 2026-07-24, so V4 is not optional

V4 Pro (`deepseek-v4-pro`, 1.6T MoE) is reserved for cases where Flash's reasoning isn't enough — overkill for this matching task.

## Prompt design

The system prompt lives in `lib/ai/index.ts` as `SYSTEM_PROMPT`. It tells the model:

- To output strict JSON (`{ matches: [...] }`) with no markdown
- To respect hard filters: destinations, English level, budget brackets, duration
- To apply soft fits: field-of-study match, career goal alignment, ranking prestige, scholarship need vs tuition
- To prefer 3 substantively different options over near-clones

The user message contains the profile (compact JSON, all 9 quiz fields including `academic_focus` and `work_experience`) and a compressed catalog (program id, name, university, country, city, field, language, duration, tuition, currency, QS ranks, first 240 chars of description). Temperature is **0.55** to leave room for prose-style rationales while keeping ranking decisions stable.

At today's catalog size (99 programs) the request is roughly **16k input tokens / ~250 output tokens** — about **$0.003 per match**.

## Output validation

`MatcherOutputSchema` (Zod) requires:

- `matches`: array of 1–5 entries
- Each entry: `program_id` (non-empty string), `score` (0–100 number), `rationale` (1–900 char string)

After parsing, we filter to `program_id`s that actually exist in the catalog (defensive against hallucinations), sort by score desc, and take the top 3.

## Failure modes

| Cause | Behavior |
|---|---|
| `AI_DISABLED=true` | `callDeepSeek` throws `AiDisabledError` immediately. Action returns the standard error envelope. |
| `DEEPSEEK_API_KEY` missing | Action returns `{ ok: false, error: "Couldn't run the matcher..." }` |
| API non-200 (5xx) | One retry with linear backoff; failure on second attempt surfaces an error. |
| Timeout (default 25s) | One retry; surfaces `AiTimeoutError` on second timeout. |
| Model returns malformed/invalid JSON | Action returns error envelope. |
| Model returns 0 valid program ids | Same. |
| All matches insert successfully but none have scores | Falls back to insertion order; first-inserted is treated as top match. |

There is intentionally **no fallback to the placeholder match** — a degraded silent fallback would mask real outages. If the matcher is down, the user sees an error and can retry. There is also no OpenAI fallback in code today; the README/`docs/decisions/0003-*` references to OpenAI as "backup" describe the abstraction (we route everything through `lib/ai/client.ts`), not a wired-up failover.

## Production env

The DeepSeek key must exist in:

- `.env.local` for local dev (gitignored)
- Vercel project env vars for production: `DEEPSEEK_API_KEY` set as a Sensitive variable, scoped to Production + Preview

After updating either, re-run `scripts/smoke-deepseek.mjs` locally to verify.

## Things deliberately not done (yet)

- No streaming — Flash is fast enough at this catalog size that the full-response wait is fine.
- No caching — each profile is unique and submissions are infrequent. Consider when traffic grows.
- No A/B between Flash and Pro — Flash is sufficient now. Reassess if the matcher feels weak in user testing.
- No per-user rate limit — current traffic doesn't warrant it. Add Upstash / KV-backed quota before opening up free access more broadly.
- No explicit cost cap — at $0.003/submission, 100 submissions/day = $0.30/day. Revisit if traffic grows ~100x.
