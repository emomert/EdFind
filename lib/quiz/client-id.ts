/**
 * Anonymous client identifier for the MVP. Generated lazily in the browser,
 * persisted to localStorage so the same student can revisit their results,
 * and copied into a server-set httpOnly cookie on submit so the results page
 * can authorize reads without exposing the value to JS again.
 */

const CLIENT_ID_STORAGE_KEY = "edfind:client_id:v1";

export function getOrCreateClientId(): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateClientId() must be called from the browser");
  }

  try {
    const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing && isUuid(existing)) return existing;
  } catch {
    // Storage may be blocked (private mode). Fall through and use an
    // in-memory ID for this session.
  }

  const fresh = crypto.randomUUID();

  try {
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, fresh);
  } catch {
    // Best-effort. Submission still works without persistence.
  }

  return fresh;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export const CLIENT_ID_COOKIE = "edfind_client_id";
