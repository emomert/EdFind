/**
 * University email verification — shared types.
 *
 * Lives apart from `./server` so client components can import the types
 * without pulling server-only modules (node:crypto, service-role client)
 * into the browser bundle.
 */

export type UniversityVerification =
  | { status: "none" }
  | { status: "pending"; email: string; domain: string; requestedAt: string }
  | { status: "expired"; email: string; domain: string }
  | {
      status: "verified";
      email: string;
      domain: string;
      verifiedAt: string | null;
    };
