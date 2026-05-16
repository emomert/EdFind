// One-shot: create the public `university-logos` Supabase Storage bucket
// if it doesn't already exist. Idempotent — safe to re-run.
//
// Run:
//   node --env-file=.env.local scripts/ensure-logo-bucket.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("✗ Missing SUPABASE env vars");
  process.exit(1);
}

const BUCKET = "university-logos";
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) {
  console.error("✗ listBuckets failed:", listErr.message);
  process.exit(1);
}

const existing = buckets?.find((b) => b.name === BUCKET);
if (existing) {
  console.log(`⊙ Bucket "${BUCKET}" already exists (public=${existing.public}).`);
  if (!existing.public) {
    const { error: updErr } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
    });
    if (updErr) {
      console.error("✗ updateBucket failed:", updErr.message);
      process.exit(1);
    }
    console.log("✓ Made bucket public.");
  }
  process.exit(0);
}

const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: "2MB",
  allowedMimeTypes: ["image/svg+xml", "image/png", "image/jpeg", "image/webp"],
});
if (createErr) {
  console.error("✗ createBucket failed:", createErr.message);
  process.exit(1);
}
console.log(`✓ Created public bucket "${BUCKET}".`);
