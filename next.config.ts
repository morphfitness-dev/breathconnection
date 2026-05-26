import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mux player requires this domain for streaming
  images: {
    domains: ["image.mux.com"],
  },
  // Silence Prisma client warnings in edge runtime
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
