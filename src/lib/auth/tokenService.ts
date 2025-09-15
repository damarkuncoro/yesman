/**
 * Token Service Wrapper
 * Wrapper untuk authService/tokenService dengan kompatibilitas backward
 * Mengikuti prinsip DRY dan SOLID
 */

import { TokenService as AuthTokenService, createTokenService } from './authService/tokenService';
import type { TokenData, JWTPayload } from './authService/tokenService';
import { useState, useEffect } from 'react';

/**
 * Client-side UserRepository implementation
 * Untuk client-side, kita tidak bisa mengakses database secara langsung
 * TokenService di client-side hanya digunakan untuk operasi localStorage dan token parsing
 * Validasi user sebenarnya dilakukan di server-side melalui API calls
 */
const clientSideUserRepository = {
  async findById(id: number) {
    // Di client-side, kita tidak melakukan validasi user dari database
    // Validasi sebenarnya dilakukan di server-side
    // Ini hanya untuk memenuhi interface TokenService
    console.warn('Client-side user validation - actual validation should be done server-side');
    return { id, email: `user${id}@example.com`, active: true };
  }
};

/**
 * Singleton instance dari AuthTokenService
 */
let tokenServiceInstance: AuthTokenService | null = null;

/**
 * Get atau create TokenService instance
 * @returns AuthTokenService instance
 */
function getTokenServiceInstance(): AuthTokenService {
  if (!tokenServiceInstance) {
    tokenServiceInstance = createTokenService(clientSideUserRepository);
  }
  return tokenServiceInstance;
}

/**
 * Token Service Class
 * Wrapper untuk AuthTokenService dengan static methods untuk kompatibilitas
 */
export class TokenService {
  private static get instance(): AuthTokenService {
    return getTokenServiceInstance();
  }

  /**
   * Menyimpan token data ke localStorage
   * @param tokenData - Data token yang akan disimpan
   */
  static setTokens(tokenData: TokenData): void {
    this.instance.setTokens(tokenData);
  }

  /**
   * Mengambil access token dari localStorage
   * @returns Access token atau null jika tidak ada
   */
  static getAccessToken(): string | null {
    return this.instance.getAccessToken();
  }

  /**
   * Mengambil refresh token dari localStorage
   * @returns Refresh token atau null jika tidak ada
   */
  static getRefreshToken(): string | null {
    return this.instance.getRefreshToken();
  }

  /**
   * Mengambil waktu expired token
   * @returns Timestamp expired atau null jika tidak ada
   */
  static getTokenExpiresAt(): number | null {
    return this.instance.getTokenExpiresAt();
  }

  /**
   * Mengecek apakah access token sudah expired
   * @returns true jika token expired, false jika masih valid
   */
  static isTokenExpired(): boolean {
    return this.instance.isStoredTokenExpired();
  }

  /**
   * Mengecek apakah token akan expired dalam waktu tertentu
   * @param minutes - Waktu dalam menit untuk mengecek
   * @returns true jika token akan expired dalam waktu yang ditentukan
   */
  static willTokenExpireIn(minutes: number): boolean {
    return this.instance.willStoredTokenExpireIn(minutes);
  }

  /**
   * Menghapus semua token dari localStorage
   */
  static clearTokens(): void {
    this.instance.clearTokens();
  }

  /**
   * Mengambil semua token data
   * @returns Object dengan semua token data
   */
  static getAllTokens(): TokenData | null {
    return this.instance.getAllTokens();
  }

  /**
   * Decode JWT token untuk mendapatkan payload (tanpa verifikasi)
   * @param token - JWT token
   * @returns Decoded payload atau null jika gagal
   */
  static decodeToken(token: string): JWTPayload | null {
    return this.instance.decodeToken(token);
  }

  /**
   * Mengambil expiration time dari token
   * @param token - JWT token
   * @returns Expiration timestamp atau null jika gagal
   */
  static getTokenExpiration(token: string): number | null {
    return this.instance.getTokenExpirationTime(token);
  }

  /**
   * Mengecek apakah format token valid
   * @param token - JWT token
   * @returns true jika format valid
   */
  static isValidTokenFormat(token: string): boolean {
    return this.instance.isValidTokenFormat(token);
  }

  /**
   * Mengecek apakah token akan expired dalam waktu tertentu (dari token langsung)
   * @param token - JWT token
   * @param thresholdSeconds - Threshold dalam detik
   * @returns true jika akan expired
   */
  static willExpireSoon(token: string, thresholdSeconds: number = 300): boolean {
    return this.instance.willExpireSoon(token, thresholdSeconds);
  }

  /**
   * Extract user ID dari token
   * @param token - JWT token
   * @returns User ID atau null jika gagal
   */
  static extractUserId(token: string): number | null {
    return this.instance.extractUserId(token);
  }

  /**
   * Extract user email dari token
   * @param token - JWT token
   * @returns User email atau null jika gagal
   */
  static extractUserEmail(token: string): string | null {
    return this.instance.extractUserEmail(token);
  }

  /**
   * Get AuthTokenService instance untuk advanced usage
   * @returns AuthTokenService instance
   */
  static getAuthServiceInstance(): AuthTokenService {
    return this.instance;
  }
}

/**
 * React Hook untuk token service dengan reactive updates
 * @returns Object dengan token data dan utility functions
 */
export function useTokenService() {
  const [tokenData, setTokenData] = useState<TokenData | null>(() => {
    return TokenService.getAllTokens();
  });

  const [isExpired, setIsExpired] = useState<boolean>(() => {
    return TokenService.isTokenExpired();
  });

  useEffect(() => {
    // Update state ketika ada perubahan di localStorage
    const handleStorageChange = () => {
      const newTokenData = TokenService.getAllTokens();
      setTokenData(newTokenData);
      setIsExpired(TokenService.isTokenExpired());
    };

    // Listen untuk storage events
    window.addEventListener('storage', handleStorageChange);

    // Custom event untuk internal updates
    window.addEventListener('tokenUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenUpdated', handleStorageChange);
    };
  }, []);

  const updateTokens = (newTokenData: TokenData) => {
    TokenService.setTokens(newTokenData);
    setTokenData(newTokenData);
    setIsExpired(false);
    
    // Dispatch custom event untuk notify komponen lain
    window.dispatchEvent(new CustomEvent('tokenUpdated'));
  };

  const clearTokens = () => {
    TokenService.clearTokens();
    setTokenData(null);
    setIsExpired(true);
    
    // Dispatch custom event untuk notify komponen lain
    window.dispatchEvent(new CustomEvent('tokenUpdated'));
  };

  return {
    tokenData,
    isExpired,
    hasToken: !!tokenData?.accessToken,
    updateTokens,
    clearTokens,
    // Utility functions
    getAccessToken: () => tokenData?.accessToken || null,
    getRefreshToken: () => tokenData?.refreshToken || null,
    getExpiresAt: () => tokenData?.expiresAt || null,
    willExpireIn: (minutes: number) => TokenService.willTokenExpireIn(minutes),
  };
}

// Export types untuk kompatibilitas
export type { TokenData, JWTPayload };

// Export default
export default TokenService;