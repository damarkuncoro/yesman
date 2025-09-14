/**
 * Konfigurasi CORS untuk development dan production
 * Mengikuti prinsip SoC (Separation of Concerns) dan DRY
 */

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

/**
 * Konfigurasi CORS untuk environment development
 * Mengizinkan akses dari IP lokal untuk development
 */
export const developmentCorsConfig: CorsConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.2.*', // IP range untuk development lokal
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
};

/**
 * Konfigurasi CORS untuk environment production
 * Lebih ketat untuk keamanan production
 */
export const productionCorsConfig: CorsConfig = {
  allowedOrigins: [
    // Tambahkan domain production di sini
    'https://yourdomain.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  credentials: true,
};

/**
 * Mendapatkan konfigurasi CORS berdasarkan environment
 * @returns CorsConfig - Konfigurasi CORS yang sesuai
 */
export function getCorsConfig(): CorsConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? developmentCorsConfig : productionCorsConfig;
}

/**
 * Memeriksa apakah origin diizinkan berdasarkan konfigurasi
 * @param origin - Origin yang akan diperiksa
 * @param config - Konfigurasi CORS
 * @returns boolean - True jika origin diizinkan
 */
export function isOriginAllowed(origin: string | null, config: CorsConfig): boolean {
  if (!origin) return false;
  
  return config.allowedOrigins.some(allowedOrigin => {
    // Handle wildcard patterns seperti '192.168.2.*'
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    
    // Exact match
    return allowedOrigin === origin;
  });
}