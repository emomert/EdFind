-- EdFind — Phase 9.3 rollback
--
-- Lives in supabase/rollbacks/ (NOT supabase/migrations/) so the auto-apply
-- script `scripts/db-migrate.mjs` never picks it up. Run by hand only when
-- the application-tracker feature is being removed (see the removability
-- discipline section of docs/phase-9-plan.md).
--
-- Steps to fully remove the feature:
--   1. Set NEXT_PUBLIC_ENABLE_APPLICATIONS=false and redeploy, so no live
--      sessions still have entry points.
--   2. Delete:  app/applications/, components/applications/, lib/feature-flags.ts
--   3. Remove the flag-guarded references in components/site-header.tsx and
--      app/programs/[universitySlug]/[programSlug]/page.tsx.
--   4. Apply this migration.

drop table if exists public.applications;
drop type if exists application_status;
