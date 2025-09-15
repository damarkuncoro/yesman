import type { NextConfig } from "next";
import setupService from "./src/services/setup";

console.log('   - next.config.ts loaded');
console.log(`🚀 YesMan Application Mode: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Environment: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);

// Jalankan setup service saat konfigurasi dimuat
setupService.setup();
const nextConfig: NextConfig = {
  
  /* config options here */
  output: 'standalone',
  
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
