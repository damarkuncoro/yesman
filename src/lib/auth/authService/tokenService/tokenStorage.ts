/**
 * Token Storage Service
 * Menangani penyimpanan dan pengambilan token dari localStorage
 * Mengikuti Single Responsibility Principle
 */

import type { TokenData } from './types';
import { LOG_PREFIXES } from './constants';

/**
 * Interface untuk Token Storage operations
 */
export interface ITokenStorage {
  setTokens(tokenData: TokenData): void;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  getTokenExpiresAt(): number | null;
  getAllTokens(): TokenData | null;
  clearTokens(): void;
  isTokenExpired(): boolean;
  willTokenExpireIn(minutes: number): boolean;
}

/**
 * Token Storage Class
 * Bertanggung jawab untuk operasi penyimpanan token di localStorage
 */
export class TokenStorage implements ITokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly EXPIRES_AT_KEY = 'tokenExpiresAt';

  /**
   * Menyimpan token data ke localStorage
   * @param tokenData - Data token yang akan disimpan
   */
  setTokens(tokenData: TokenData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(TokenStorage.ACCESS_TOKEN_KEY, tokenData.accessToken);
      
      if (tokenData.refreshToken) {
        localStorage.setItem(TokenStorage.REFRESH_TOKEN_KEY, tokenData.refreshToken);
      }
      
      if (tokenData.expiresAt) {
        localStorage.setItem(TokenStorage.EXPIRES_AT_KEY, tokenData.expiresAt.toString());
      }
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Error setting tokens:`, error);
    }
  }

  /**
   * Mengambil access token dari localStorage
   * @returns Access token atau null jika tidak ada
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem(TokenStorage.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Error getting access token:`, error);
      return null;
    }
  }

  /**
   * Mengambil refresh token dari localStorage
   * @returns Refresh token atau null jika tidak ada
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem(TokenStorage.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Error getting refresh token:`, error);
      return null;
    }
  }

  /**
   * Mengambil waktu expired token
   * @returns Timestamp expired atau null jika tidak ada
   */
  getTokenExpiresAt(): number | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const expiresAt = localStorage.getItem(TokenStorage.EXPIRES_AT_KEY);
      return expiresAt ? parseInt(expiresAt, 10) : null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Error getting token expires at:`, error);
      return null;
    }
  }

  /**
   * Mengambil semua token data
   * @returns Object dengan semua token data
   */
  getAllTokens(): TokenData | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;
    
    return {
      accessToken,
      refreshToken: this.getRefreshToken() || undefined,
      expiresAt: this.getTokenExpiresAt() || undefined,
    };
  }

  /**
   * Menghapus semua token dari localStorage
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(TokenStorage.ACCESS_TOKEN_KEY);
      localStorage.removeItem(TokenStorage.REFRESH_TOKEN_KEY);
      localStorage.removeItem(TokenStorage.EXPIRES_AT_KEY);
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Error clearing tokens:`, error);
    }
  }

  /**
   * Mengecek apakah access token sudah expired
   * @returns true jika token expired, false jika masih valid
   */
  isTokenExpired(): boolean {
    const expiresAt = this.getTokenExpiresAt();
    if (!expiresAt) return false; // Jika tidak ada info expired, anggap masih valid
    
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 menit buffer sebelum expired
    
    return now >= (expiresAt - bufferTime);
  }

  /**
   * Mengecek apakah token akan expired dalam waktu tertentu
   * @param minutes - Waktu dalam menit untuk mengecek
   * @returns true jika token akan expired dalam waktu yang ditentukan
   */
  willTokenExpireIn(minutes: number): boolean {
    const expiresAt = this.getTokenExpiresAt();
    if (!expiresAt) return false;
    
    const now = Date.now();
    const checkTime = minutes * 60 * 1000;
    
    return now >= (expiresAt - checkTime);
  }
}

/**
 * Factory function untuk membuat TokenStorage instance
 * @returns TokenStorage instance
 */
export function createTokenStorage(): TokenStorage {
  return new TokenStorage();
}

/**
 * Default TokenStorage instance
 */
export const tokenStorage = createTokenStorage();

/**
 * Export default
 */
export default TokenStorage;