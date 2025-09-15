import { TokenService } from './tokenService';
import { publicHttpClient } from '../http/httpClient';
import type { AuthApiResponse } from '@/contexts/AuthContext/types';

/**
 * Service untuk menangani refresh token flow
 * Mengikuti prinsip Single Responsibility dan Error Handling
 */
export class RefreshTokenService {
  private static isRefreshing = false;
  private static refreshPromise: Promise<string> | null = null;
  private static failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  /**
   * Process failed queue setelah refresh berhasil atau gagal
   * @param error - Error jika refresh gagal
   * @param token - Token baru jika refresh berhasil
   */
  private static processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Melakukan refresh token dengan queue management
   * @returns Promise dengan access token baru
   */
  static async refreshToken(): Promise<string> {
    // Jika sedang dalam proses refresh, tambahkan ke queue
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    // Jika sudah ada promise refresh yang berjalan, return promise tersebut
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = TokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    
    this.refreshPromise = this.performRefresh(refreshToken)
      .then((newAccessToken) => {
        this.processQueue(null, newAccessToken);
        return newAccessToken;
      })
      .catch((error) => {
        this.processQueue(error);
        throw error;
      })
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  /**
   * Melakukan actual refresh token API call
   * @param refreshToken - Refresh token yang akan digunakan
   * @returns Promise dengan access token baru
   */
  private static async performRefresh(refreshToken: string): Promise<string> {
    try {
      console.log('🔄 Refreshing access token...');
      
      const response = await publicHttpClient.post('/auth/refresh', {
        refreshToken
      }, {
        requireAuth: false // Tidak perlu auth header untuk refresh
      }) as AuthApiResponse;

      if (!response.success) {
        throw new Error(response.message || 'Token refresh failed');
      }

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Hitung waktu expired dari token baru
      const expiresAt = TokenService.getTokenExpiration(accessToken);
      
      // Simpan token baru
      TokenService.setTokens({
        accessToken,
        refreshToken: newRefreshToken || refreshToken, // Gunakan refresh token baru jika ada
        expiresAt: expiresAt || undefined
      });

      console.log('✅ Token refreshed successfully');
      return accessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Clear tokens jika refresh gagal
      TokenService.clearTokens();
      
      // Dispatch event untuk logout
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:token-refresh-failed', {
          detail: { error }
        }));
      }
      
      throw error;
    }
  }

  /**
   * Mengecek apakah perlu refresh token dan melakukan refresh jika perlu
   * @returns Promise dengan access token (existing atau yang baru)
   */
  static async ensureValidToken(): Promise<string> {
    const accessToken = TokenService.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Jika token tidak expired, return token yang ada
    if (!TokenService.isTokenExpired()) {
      return accessToken;
    }

    // Jika token expired, lakukan refresh
    console.log('🔄 Access token expired, refreshing...');
    return await this.refreshToken();
  }

  /**
   * Melakukan proactive refresh jika token akan expired dalam waktu tertentu
   * @param minutes - Waktu dalam menit sebelum expired untuk melakukan refresh
   * @returns Promise dengan access token
   */
  static async proactiveRefresh(minutes: number = 5): Promise<string | null> {
    const accessToken = TokenService.getAccessToken();
    
    if (!accessToken) {
      return null;
    }

    // Jika token akan expired dalam waktu yang ditentukan, lakukan refresh
    if (TokenService.willTokenExpireIn(minutes)) {
      try {
        console.log(`🔄 Token will expire in ${minutes} minutes, proactively refreshing...`);
        return await this.refreshToken();
      } catch (error) {
        console.error('Proactive refresh failed:', error);
        return accessToken; // Return existing token jika proactive refresh gagal
      }
    }

    return accessToken;
  }

  /**
   * Setup automatic token refresh dengan interval
   * @param intervalMinutes - Interval dalam menit untuk mengecek token
   * @returns Function untuk clear interval
   */
  static setupAutoRefresh(intervalMinutes: number = 5): () => void {
    const intervalId = setInterval(async () => {
      try {
        await this.proactiveRefresh(10); // Refresh 10 menit sebelum expired
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Return function untuk clear interval
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Reset refresh state (untuk testing atau error recovery)
   */
  static resetRefreshState(): void {
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.failedQueue = [];
  }

  /**
   * Mengecek apakah sedang dalam proses refresh
   * @returns true jika sedang refresh
   */
  static isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }
}

/**
 * Hook untuk menggunakan RefreshTokenService dengan reactive updates
 */
export function useRefreshToken() {
  const refreshToken = async () => {
    try {
      return await RefreshTokenService.refreshToken();
    } catch (error) {
      console.error('Refresh token failed:', error);
      throw error;
    }
  };

  const ensureValidToken = async () => {
    try {
      return await RefreshTokenService.ensureValidToken();
    } catch (error) {
      console.error('Ensure valid token failed:', error);
      throw error;
    }
  };

  return {
    refreshToken,
    ensureValidToken,
    proactiveRefresh: RefreshTokenService.proactiveRefresh,
    setupAutoRefresh: RefreshTokenService.setupAutoRefresh,
    isCurrentlyRefreshing: RefreshTokenService.isCurrentlyRefreshing,
  };
}