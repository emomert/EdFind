import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseHost = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Pin workspace root to this project so Turbopack ignores any lockfiles
  // higher up the directory tree (e.g. one in the user's home folder).
  // Uses import.meta.dirname (ESM) — __dirname is unreliable when Next 16
  // loads next.config.ts as a module, and would resolve one level up,
  // causing Tailwind to look for node_modules in the parent folder.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    // University logos live in Supabase Storage. We also allow upload.wikimedia.org
    // as a transitional source — the importer normalizes to Supabase Storage but
    // a few records may temporarily point at Wikimedia during a migration.
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
};

// Locale comes from the edfind_locale cookie (ADR 0007); the plugin wires
// i18n/request.ts as the per-request next-intl config.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
