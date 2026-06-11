import { redirect } from "next/navigation";

/**
 * Legacy route — the community subscription merged into the single Premium
 * tier (2026-06-11). Old links and CTAs land on the unified paywall.
 */
export default function CommunityUpgradePage() {
  redirect("/premium?next=/community");
}
