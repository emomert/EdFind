import "server-only";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// 25s is well below Vercel's 30s default function timeout but still leaves
// V4 Flash room to return long rationales. Override via env if a deployment
// needs different headroom.
const DEFAULT_TIMEOUT_MS = Number.parseInt(
  process.env.AI_TIMEOUT_MS ?? "25000",
  10,
);

export class AiDisabledError extends Error {
  constructor() {
    super("AI is temporarily disabled");
    this.name = "AiDisabledError";
  }
}

export class AiTimeoutError extends Error {
  constructor() {
    super("AI request timed out");
    this.name = "AiTimeoutError";
  }
}

export type DeepSeekRequestBody = {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  response_format?: { type: "json_object" };
  temperature?: number;
  max_tokens?: number;
  thinking?: { type: "disabled" | "enabled" };
};

/**
 * Single shared entry point for DeepSeek chat completions. Wraps the raw
 * fetch with:
 *   - Kill switch (AI_DISABLED=true returns early with a typed error)
 *   - AbortController timeout (25s default, overridable via AI_TIMEOUT_MS)
 *   - One retry on 5xx / network failure with linear backoff
 *
 * Throws on non-OK responses with a 300-char preview of the error body.
 * Returns the parsed JSON body. Callers handle their own response_format
 * validation (matcher and parser both use zod).
 */
export async function callDeepSeek(
  body: DeepSeekRequestBody,
): Promise<unknown> {
  if (process.env.AI_DISABLED === "true") {
    throw new AiDisabledError();
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const isRetryable = res.status >= 500 && res.status < 600;
        if (isRetryable && attempt < maxAttempts) {
          lastError = new Error(
            `DeepSeek API ${res.status}: ${errText.slice(0, 300)}`,
          );
          await sleep(400 * attempt);
          continue;
        }
        throw new Error(`DeepSeek API ${res.status}: ${errText.slice(0, 300)}`);
      }

      return await res.json();
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      if (isAbort) {
        // Timeouts get one retry — same as 5xx.
        if (attempt < maxAttempts) {
          lastError = new AiTimeoutError();
          continue;
        }
        throw new AiTimeoutError();
      }
      // Network-level errors (TypeError from fetch) retry once.
      if (err instanceof TypeError && attempt < maxAttempts) {
        lastError = err;
        await sleep(400 * attempt);
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("DeepSeek call failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
