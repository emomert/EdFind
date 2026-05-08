import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root to this project so Turbopack ignores any lockfiles
  // higher up the directory tree (e.g. one in the user's home folder).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
