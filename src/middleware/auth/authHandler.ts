/**
 * Authentication Handler Module
 * 
 * Bertanggung jawab untuk menangani proses autentikasi dalam middleware.
 * Mengikuti prinsip SOLID:
 * - Single Responsibility: Hanya menangani autentikasi
 * - Open/Closed: Dapat diperluas tanpa modifikasi
 * - Liskov Substitution: Interface yang konsisten
 * - Interface Segregation: Interface yang spesifik
 * - Dependency Inversion: Bergantung pada abstraksi
 * 
 * Menerapkan prinsip DRY dengan:
 * - Centralized error handling
 * - Reusable error mapping
 * - Consistent response patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyTokenAndGetUserContext,
  type AuthenticatedUserContext
} from '@/lib/authUtils';
import { verifyRefreshTokenAndGetUserContext } from '@/lib/auth/authService';
import { ErrorHandler } from '@/lib/errors/errorHandler';
import { AuthorizationOptions, MiddlewareResult } from '../types';
import { ContextFactory } from '../types';

/**
 * Enum untuk tipe error autentikasi
 * Mengikuti prinsip DRY dengan centralized error types
 */
enum AuthErrorType {
  TOKEN_NOT_FOUND = 'Token tidak ditemukan',
  TOKEN_INVALID = 'Token tidak valid',
  USER_INACTIVE = 'User tidak aktif',
  SERVER_ERROR = 'Terjadi kesalahan pada server',
  AUTH_REQUIRED = 'Authentication diperlukan'
}

/**
 * Mapping error message ke HTTP status code
 * Mengikuti prinsip DRY untuk error handling
 */
const ERROR_STATUS_MAP: Record<string, number> = {
  [AuthErrorType.TOKEN_NOT_FOUND]: 401,
  [AuthErrorType.TOKEN_INVALID]: 401,
  [AuthErrorType.USER_INACTIVE]: 401,
  [AuthErrorType.AUTH_REQUIRED]: 401,
  [AuthErrorType.SERVER_ERROR]: 500
} as const;

/**
 * Interface untuk authentication result
 * Mengikuti prinsip Interface Segregation
 */
interface AuthenticationResult {
  success: boolean;
  userContext?: AuthenticatedUserContext;
  error?: Error;
}

/**
 * Authentication Handler Class
 * 
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Hanya bertanggung jawab untuk proses autentikasi
 */
export class AuthHandler {
  /**
   * Constructor dengan dependency injection
   * Mengikuti prinsip Dependency Inversion
   * 
   * @param contextFactory - Factory untuk membuat context
   */
  constructor(private readonly contextFactory: ContextFactory) {}

  /**
   * Melakukan autentikasi user berdasarkan request
   * 
   * Mengikuti prinsip Single Responsibility:
   * - Hanya menangani proses autentikasi
   * - Delegasi error handling ke method terpisah
   * 
   * @param request - NextRequest object yang berisi token
   * @returns Promise<AuthenticationResult> - Hasil autentikasi
   */
  async authenticateUser(request: NextRequest): Promise<AuthenticationResult> {
    try {
      // Extract token dari Authorization header atau cookie
      let token: string | null = null;
      
      // Cek Authorization header terlebih dahulu
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
      
      // Jika tidak ada di header, cek cookie sebagai fallback
      if (!token) {
        const refreshTokenCookie = request.cookies.get('refreshToken');
        if (refreshTokenCookie) {
          token = refreshTokenCookie.value;
        }
      }
      
      // Jika masih tidak ada token, throw error
      if (!token) {
        throw new Error(AuthErrorType.TOKEN_NOT_FOUND);
      }
      
      // Tentukan fungsi verifikasi berdasarkan sumber token
      let userContext: AuthenticatedUserContext | null = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Token dari header Authorization adalah access token
        userContext = await verifyTokenAndGetUserContext(token);
        
        // Jika access token expired, coba gunakan refresh token dari cookie
        if (!userContext) {
          const refreshTokenCookie = request.cookies.get('refreshToken');
          if (refreshTokenCookie) {
            userContext = await verifyRefreshTokenAndGetUserContext(refreshTokenCookie.value);
          }
        }
      } else {
        // Token dari cookie adalah refresh token
        userContext = await verifyRefreshTokenAndGetUserContext(token);
      }
      
      if (!userContext) {
        throw new Error(AuthErrorType.TOKEN_INVALID);
      }
      
      return {
        success: true,
        userContext
      };
    } catch (error) {
      return {
        success: false,
        error: this.normalizeAuthError(error)
      };
    }
  }

  /**
   * Normalize error menjadi format yang konsisten
   * Mengikuti prinsip DRY untuk error handling
   * 
   * @param error - Error yang terjadi
   * @returns Error - Normalized error
   */
  private normalizeAuthError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(AuthErrorType.SERVER_ERROR);
  }

  /**
   * Menangani authentication error dan mengembalikan response yang sesuai
   * 
   * Mengikuti prinsip DRY:
   * - Menggunakan centralized error mapping
   * - Reusable error response creation
   * 
   * @param error - Error yang terjadi selama autentikasi
   * @returns NextResponse - HTTP response dengan status code yang sesuai
   */
  handleAuthError(error: Error): NextResponse {
    const errorMessage = error.message;
    const statusCode = this.getErrorStatusCode(errorMessage);
    
    // Gunakan error class yang tepat berdasarkan status code
    if (statusCode === 401) {
      const authError = ErrorHandler.handleError(
        error,
        'authentication',
        {
          errorType: 'AUTHENTICATION_ERROR',
          originalMessage: errorMessage,
          statusCode: statusCode,
          timestamp: new Date().toISOString()
        }
      );
      return ErrorHandler.createErrorResponse(authError);
    }
    
    // Fallback untuk error lainnya
    return ErrorHandler.createErrorResponse(error);
  }

  /**
   * Mendapatkan status code berdasarkan error message
   * Mengikuti prinsip DRY dengan centralized mapping
   * 
   * @param errorMessage - Pesan error
   * @returns number - HTTP status code
   */
  private getErrorStatusCode(errorMessage: string): number {
    return ERROR_STATUS_MAP[errorMessage] || ERROR_STATUS_MAP[AuthErrorType.SERVER_ERROR];
  }

  /**
   * Menangani akses public berdasarkan authorization options
   * 
   * Mengikuti prinsip Open/Closed:
   * - Dapat diperluas dengan options baru tanpa modifikasi
   * 
   * @param options - Opsi authorization yang menentukan akses public
   * @returns MiddlewareResult - Context public atau error response
   */
  handlePublicAccess(options?: AuthorizationOptions): MiddlewareResult {
    if (this.isPublicAccessAllowed(options)) {
      return this.contextFactory.createPublicContext();
    }
    
    const authError = ErrorHandler.handleError(
      new Error(AuthErrorType.AUTH_REQUIRED),
      'authentication',
      {
        errorType: 'AUTHENTICATION_ERROR',
        reason: 'authentication_required',
        timestamp: new Date().toISOString()
      }
    );
    return ErrorHandler.createErrorResponse(authError);
  }

  /**
   * Memeriksa apakah akses public diizinkan
   * Mengikuti prinsip Single Responsibility
   * 
   * @param options - Authorization options
   * @returns boolean - True jika public access diizinkan
   */
  private isPublicAccessAllowed(options?: AuthorizationOptions): boolean {
    return Boolean(options?.allowPublic);
  }

  /**
    * Melakukan full authentication flow
    * Mengikuti prinsip Composition over Inheritance
    * 
    * @param request - NextRequest object
    * @param options - Authorization options
    * @returns Promise<MiddlewareResult> - Hasil authentication
    */
   async processAuthentication(
     request: NextRequest, 
     options?: AuthorizationOptions
   ): Promise<MiddlewareResult> {
     const authResult = await this.authenticateUser(request);
     
     if (authResult.success && authResult.userContext) {
       return await this.contextFactory.createAuthorizationContext(authResult.userContext);
     }
     
     if (authResult.error) {
       // Jika authentication gagal, cek apakah public access diizinkan
       if (this.isPublicAccessAllowed(options)) {
         return this.handlePublicAccess(options);
       }
       
       return this.handleAuthError(authResult.error);
     }
     
     return ErrorHandler.createErrorResponse(
       new Error(AuthErrorType.SERVER_ERROR)
     );
   }
}

/**
 * Factory function untuk membuat auth handler
 * Mengikuti prinsip Dependency Inversion dan Factory Pattern
 * 
 * @param contextFactory - Factory untuk membuat context
 * @returns AuthHandler - Instance dari auth handler
 */
export function createAuthHandler(contextFactory: ContextFactory): AuthHandler {
  return new AuthHandler(contextFactory);
}

/**
 * Export types untuk external usage
 * Mengikuti prinsip Interface Segregation
 */
export type { AuthenticationResult };
export { AuthErrorType };