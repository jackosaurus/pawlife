import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Avoid Next.js inferring the parent monorepo root.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
