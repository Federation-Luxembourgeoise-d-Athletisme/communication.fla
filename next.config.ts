import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permet un second serveur local (ex. sur les émulateurs) sans conflit avec `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
