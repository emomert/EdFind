"use client";

import { createContext, useContext } from "react";

import type { UniversityVerification } from "@/lib/verification/types";

/**
 * University-email verification state for the community — mirrors the
 * subscription context one file over. The value comes from the server
 * (app/community/page.tsx reads the table); the swap to richer entitlements
 * later stays a one-file change, same as subscriptions.
 *
 * Subscription and verification are independent axes:
 *   - subscription → can the user ACCESS premium community content
 *   - verification → can the user WRITE (chat, reviews, questions)
 */

type VerificationContextValue = {
  verification: UniversityVerification;
  /** True only for accounts with a confirmed university email. */
  canWrite: boolean;
};

const VerificationContext = createContext<VerificationContextValue>({
  verification: { status: "none" },
  canWrite: false,
});

export function VerificationProvider({
  verification,
  children,
}: {
  verification: UniversityVerification;
  children: React.ReactNode;
}) {
  return (
    <VerificationContext.Provider
      value={{ verification, canWrite: verification.status === "verified" }}
    >
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification(): VerificationContextValue {
  return useContext(VerificationContext);
}
