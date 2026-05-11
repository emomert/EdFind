"use client";

import { useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Sign-in didn't complete — please try again.",
  exchange_failed: "Couldn't complete sign-in. Please try again.",
};

export function LoginClient({
  next,
  error,
}: {
  next: string;
  error: string | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setSubmitting(true);
    setInternalError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next,
    )}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (signInError) {
      setSubmitting(false);
      setInternalError(signInError.message);
    }
    // On success Supabase navigates the browser to Google — we won't see the
    // redirect resolve here.
  };

  const errorMessage =
    internalError ?? (error ? ERROR_MESSAGES[error] ?? null : null);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
        <Sparkles className="size-3.5" />
        Welcome
      </span>
      <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        Sign in to EdFind
      </h1>
      <p className="mt-4 text-pretty text-sm text-muted-foreground">
        Your matches, shortlist, and tracked applications stay with you across
        devices. We only use your Google account for authentication — never to
        post or email anything.
      </p>

      <div className="mt-10 w-full">
        <Button
          type="button"
          size="lg"
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full"
        >
          <GoogleIcon />
          {submitting ? "Redirecting to Google…" : "Continue with Google"}
        </Button>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle className="size-3.5" />
            {errorMessage}
          </p>
        ) : null}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        By continuing you agree to share your Google profile (name and email)
        with EdFind for account purposes.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.78-.07-1.53-.2-2.27H12v4.51h6.47c-.28 1.4-1.1 2.59-2.35 3.39v2.81h3.79c2.22-2.04 3.58-5.05 3.58-8.44z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.79-2.81c-1.04.7-2.37 1.13-4.14 1.13-3.18 0-5.88-2.14-6.84-5.03H1.27v2.91A11.997 11.997 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.16 14.38c-.24-.7-.38-1.45-.38-2.23 0-.78.14-1.53.38-2.23V7.01H1.27A11.97 11.97 0 0 0 0 12.15c0 1.93.45 3.76 1.27 5.38l3.89-2.91z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.36.61 4.61 1.81L20 3.18C17.95 1.21 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.62l3.89 2.91C6.12 6.66 8.82 4.75 12 4.75z"
      />
    </svg>
  );
}
