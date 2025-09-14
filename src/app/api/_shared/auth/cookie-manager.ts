import { NextResponse } from "next/server";
import { CookieConfig } from '../types';

/**
 * Class untuk mengelola cookie auth secara terpusat
 * Menerapkan Single Responsibility Principle (SRP)
 */
export class AuthCookieManager {
  /**
   * Konfigurasi default untuk refresh token cookie
   */
  private static getDefaultCookieConfig(): CookieConfig {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 hari dalam detik
      path: "/",
    };
  }

  /**
   * Set refresh token cookie pada response
   */
  static setRefreshTokenCookie(
    response: NextResponse,
    refreshToken: string,
    customConfig?: Partial<CookieConfig>
  ): void {
    const config = {
      ...this.getDefaultCookieConfig(),
      ...customConfig,
    };

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite,
      maxAge: config.maxAge,
      path: config.path,
    });
  }

  /**
   * Hapus refresh token cookie dari response
   */
  static clearRefreshTokenCookie(response: NextResponse): void {
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });
  }

  /**
   * Set refresh token cookie dengan response builder
   * Menggabungkan response building dengan cookie setting
   */
  static setRefreshTokenOnResponse(
    response: NextResponse,
    refreshToken: string
  ): NextResponse {
    this.setRefreshTokenCookie(response, refreshToken);
    return response;
  }

  /**
   * Clear refresh token cookie dengan response builder
   */
  static clearRefreshTokenOnResponse(
    response: NextResponse
  ): NextResponse {
    this.clearRefreshTokenCookie(response);
    return response;
  }

  /**
   * Validasi apakah cookie config valid
   */
  static validateCookieConfig(config: Partial<CookieConfig>): boolean {
    if (config.maxAge !== undefined && config.maxAge < 0) {
      return false;
    }
    
    if (config.sameSite && !['strict', 'lax', 'none'].includes(config.sameSite)) {
      return false;
    }
    
    return true;
  }

  /**
   * Dapatkan konfigurasi cookie untuk environment tertentu
   */
  static getCookieConfigForEnvironment(env: 'development' | 'production'): CookieConfig {
    const baseConfig = this.getDefaultCookieConfig();
    
    if (env === 'development') {
      return {
        ...baseConfig,
        secure: false, // Allow HTTP in development
      };
    }
    
    return baseConfig;
  }
}