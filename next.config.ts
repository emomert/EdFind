import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root to this project so Turbopack ignores any lockfiles
  // higher up the directory tree (e.g. one in the user's home folder).
  // Uses import.meta.dirname (ESM) — __dirname is unreliable when Next 16
  // loads next.config.ts as a module, and would resolve one level up,
  // causing Tailwind to look for node_modules in the parent folder.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
