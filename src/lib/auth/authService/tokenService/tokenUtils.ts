/**
 * Token Utilities
 * Utility functions untuk operasi token yang umum
 * Mengikuti Single Responsibility Principle
 */

import jwt from 'jsonwebtoken';
import type { JWTPayload, ITokenUtils } from './types';
import { LOG_PREFIXES, getCurrentTimestamp } from './constants';

/**
 * Token Utils Class
 * Berisi utility functions untuk operasi token
 */
export class TokenUtils implements ITokenUtils {
  /**
   * Decode JWT token tanpa verifikasi
   * @param token - JWT token yang akan di-decode
   * @returns Decoded payload atau null jika gagal
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      
      if (!decoded || typeof decoded !== 'object') {
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to decode token:`, error);
      return null;
    }
  }

  /**
   * Cek apakah token sudah expired
   * @param token - JWT token yang akan dicek
   * @returns true jika expired, false jika masih valid
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        return true; // Anggap expired jika tidak bisa decode atau tidak ada exp
      }
      
      const currentTime = getCurrentTimestamp();
      return decoded.exp < currentTime;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to check token expiration:`, error);
      return true; // Anggap expired jika ada error
    }
  }

  /**
   * Get token expiration time
   * @param token - JWT token
   * @returns Expiration timestamp atau null jika gagal
   */
  getTokenExpiration(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.exp || null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to get token expiration:`, error);
      return null;
    }
  }

  /**
   * Get token expiration time (alias for interface compatibility)
   * @param token - JWT token
   * @returns Expiration timestamp atau null jika gagal
   */
  getTokenExpirationTime(token: string): number | null {
    return this.getTokenExpiration(token);
  }

  /**
   * Get token issued at time
   * @param token - JWT token
   * @returns Issued at timestamp atau null jika gagal
   */
  getTokenIssuedAt(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.iat || null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to get token issued at:`, error);
      return null;
    }
  }

  /**
   * Get token issued time (alias for interface compatibility)
   * @param token - JWT token
   * @returns Issued at timestamp atau null jika gagal
   */
  getTokenIssuedTime(token: string): number | null {
    return this.getTokenIssuedAt(token);
  }

  /**
   * Get remaining time until token expires
   * @param token - JWT token
   * @returns Remaining seconds atau null jika gagal/expired
   */
  getTokenRemainingTime(token: string): number | null {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return null;
      }
      
      const currentTime = getCurrentTimestamp();
      const remaining = expiration - currentTime;
      
      return remaining > 0 ? remaining : null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to get token remaining time:`, error);
      return null;
    }
  }

  /**
   * Extract user ID from token
   * @param token - JWT token
   * @returns User ID atau null jika gagal
   */
  extractUserId(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.userId || null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to extract user ID:`, error);
      return null;
    }
  }

  /**
   * Extract user email from token
   * @param token - JWT token
   * @returns User email atau null jika gagal
   */
  extractUserEmail(token: string): string | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.email || null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to extract user email:`, error);
      return null;
    }
  }

  /**
   * Extract user role from token
   * @param token - JWT token
   * @returns User role atau null jika gagal
   */
  extractUserRole(token: string): string | null {
    try {
      const decoded = this.decodeToken(token);
      return (decoded as any)?.role || null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to extract user role:`, error);
      return null;
    }
  }

  /**
   * Validate token format (basic JWT structure check)
   * @param token - Token string to validate
   * @returns true jika format valid, false jika tidak
   */
  isValidTokenFormat(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }
      
      // JWT harus memiliki 3 bagian yang dipisahkan dengan '.'
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      // Cek apakah setiap bagian adalah base64 yang valid
      for (const part of parts) {
        if (!part || part.length === 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to validate token format:`, error);
      return false;
    }
  }

  /**
   * Get token header information
   * @param token - JWT token
   * @returns Token header atau null jika gagal
   */
  getTokenHeader(token: string): any | null {
    try {
      if (!this.isValidTokenFormat(token)) {
        return null;
      }
      
      const header = jwt.decode(token, { complete: true })?.header;
      return header || null;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to get token header:`, error);
      return null;
    }
  }

  /**
   * Compare two tokens
   * @param token1 - First token
   * @param token2 - Second token
   * @returns true jika sama, false jika berbeda
   */
  compareTokens(token1: string, token2: string): boolean {
    try {
      if (!token1 || !token2) {
        return false;
      }
      
      return token1 === token2;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to compare tokens:`, error);
      return false;
    }
  }

  /**
   * Batch decode multiple tokens
   * @param tokens - Array of tokens to decode
   * @returns Array of decoded payloads
   */
  batchDecodeTokens(tokens: string[]): (JWTPayload | null)[] {
    return tokens.map(token => this.decodeToken(token));
  }

  /**
   * Check if token will expire soon
   * @param token - JWT token
   * @param thresholdSeconds - Threshold in seconds (default: 300 = 5 minutes)
   * @returns true jika akan expire dalam threshold, false jika tidak
   */
  willExpireSoon(token: string, thresholdSeconds: number = 300): boolean {
    try {
      const remainingTime = this.getTokenRemainingTime(token);
      if (remainingTime === null) {
        return true; // Anggap akan expire jika tidak bisa get remaining time
      }
      
      return remainingTime <= thresholdSeconds;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to check if token will expire soon:`, error);
      return true;
    }
  }
}

/**
 * Factory function untuk membuat TokenUtils
 * @returns TokenUtils instance
 */
export function createTokenUtils(): TokenUtils {
  return new TokenUtils();
}

/**
 * Default instance untuk penggunaan langsung
 */
export const tokenUtils = createTokenUtils();

/**
 * Export untuk backward compatibility
 */
export default TokenUtils;