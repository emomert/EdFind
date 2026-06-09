-- University hero images — attribution columns.
--
-- `universities.hero_image_url` already exists (init schema) but was never
-- populated or displayed. Real campus photos sourced from Wikimedia Commons /
-- other licensed sources REQUIRE attribution, so add the credit + source link
-- the UI shows alongside the image. Populated by the image-research workflow
-- + scripts/import-university-images.mjs.

alter table public.universities
  add column if not exists hero_image_credit text,       -- e.g. "Photo: Jane Doe / Wikimedia Commons, CC BY-SA 4.0"
  add column if not exists hero_image_source_url text;    -- link to the image's source / licensing page
