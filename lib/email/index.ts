import "server-only";

/**
 * Provider-agnostic transactional email — mirrors the `lib/ai/index.ts`
 * pattern: feature code imports `sendEmail()` from here and never touches a
 * vendor SDK or API shape directly.
 *
 * Current provider: Resend via its REST API (no SDK dependency) — see
 * docs/decisions/0004-resend-transactional-email.md.
 *
 * Server-only: reads RESEND_API_KEY. Never import from client components.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "EdFind <onboarding@resend.dev>";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: "not-configured" | "send-failed"; detail?: string };

/** Is a transactional email provider configured at all? */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "not-configured" };
  }

  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        sent: false,
        reason: "send-failed",
        detail: `Resend ${response.status}: ${body.slice(0, 300)}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return { sent: true, id: data.id ?? null };
  } catch (error) {
    return {
      sent: false,
      reason: "send-failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
