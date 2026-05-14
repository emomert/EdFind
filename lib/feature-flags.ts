/**
 * Feature flags.
 *
 * Each flag is a `const` boolean. Pages and components import the constant
 * directly so removing a feature is a matter of:
 *   1. flipping the flag (forces it false)
 *   2. deleting the feature's files
 *   3. cleaning up the now-dead guards (grep for the const name)
 *
 * The application tracker is the canonical example — see
 * docs/phase-9-plan.md "removability discipline" for the removal recipe.
 */

const isOff = (v: string | undefined) => v === "false" || v === "0";

/**
 * Application tracker (Phase 9.3). Controls whether the kanban view, "Track
 * this application" buttons, and the /applications route are exposed. Default
 * on; set NEXT_PUBLIC_ENABLE_APPLICATIONS=false to hide every entry point
 * without removing the database table.
 */
export const APPLICATIONS_ENABLED = !isOff(
  process.env.NEXT_PUBLIC_ENABLE_APPLICATIONS,
);

/**
 * Community / Verified Student Insights page. Controls whether /community
 * is exposed and whether the header nav link is rendered. Pure mock data
 * for now (see lib/community/fake-data.ts); subscription state is a cookie
 * dev toggle until Stripe is wired. Default on; set
 * NEXT_PUBLIC_ENABLE_COMMUNITY=false to hide.
 */
export const COMMUNITY_ENABLED = !isOff(
  process.env.NEXT_PUBLIC_ENABLE_COMMUNITY,
);
