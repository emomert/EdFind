-- Uninstall script for the AI document studio (application_documents).
-- NOT run by scripts/db-migrate.mjs — apply by hand from the dashboard SQL
-- editor only when removing the feature for good.

drop table if exists public.application_documents;
drop type if exists document_kind;
