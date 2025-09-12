import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Konfigurasi untuk mengizinkan cross-origin requests dari IP lokal
  allowedDevOrigins: ['*'],
  
  eslint: {
    // Abaikan ESLint errors selama build
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Optimasi untuk production build
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
