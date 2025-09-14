import { NextRequest } from "next/server";
import { RequestContext } from '../types';

/**
 * Class untuk menangani parsing dan ekstraksi data dari request
 * Menerapkan Single Responsibility Principle (SRP)
 */
export class AuthRequestHandler {
  /**
   * Parse JSON body dari request dengan error handling
   */
  static async parseJsonBody<T = any>(request: NextRequest): Promise<T> {
    try {
      const body = await request.json();
      return body as T;
    } catch (error) {
      throw new Error('Invalid JSON format in request body');
    }
  }

  /**
   * Ekstrak refresh token dari cookie
   */
  static getRefreshTokenFromCookie(request: NextRequest): string | null {
    return request.cookies.get("refreshToken")?.value || null;
  }

  /**
   * Ekstrak access token dari Authorization header
   */
  static getAccessTokenFromHeader(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  /**
   * Buat context dari request untuk logging dan debugging
   */
  static createRequestContext(
    request: NextRequest, 
    endpoint: string
  ): RequestContext {
    const userAgent = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    return {
      userAgent,
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Dapatkan semua nama cookie untuk debugging
   */
  static getCookieNames(request: NextRequest): string[] {
    return request.cookies.getAll().map(cookie => cookie.name);
  }

  /**
   * Validasi apakah request memiliki content-type JSON
   */
  static hasJsonContentType(request: NextRequest): boolean {
    const contentType = request.headers.get("content-type");
    return contentType?.includes("application/json") || false;
  }
}