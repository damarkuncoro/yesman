import { NextResponse } from "next/server";
import { ErrorContext } from './types';
import { AuthResponseBuilder } from './response-builder';

/**
 * Class untuk menangani error secara terpusat
 * Menerapkan Single Responsibility Principle (SRP)
 */
export class AuthErrorHandler {
  /**
   * Handle error umum dengan logging
   */
  static handleError(
    error: unknown,
    context: ErrorContext,
    defaultMessage: string = "Terjadi kesalahan pada server"
  ): NextResponse {
    // Log error untuk debugging
    console.error(`Error at ${context.endpoint}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });

    // Tentukan response berdasarkan jenis error
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('validation') || error.message.includes('Validation')) {
        return AuthResponseBuilder.createValidationErrorResponse(
          error.message
        );
      }
      
      if (error.message.includes('authentication') || error.message.includes('Authentication')) {
        return AuthResponseBuilder.createAuthErrorResponse(
          error.message
        );
      }
      
      if (error.message.includes('authorization') || error.message.includes('Authorization')) {
        return AuthResponseBuilder.createAuthorizationErrorResponse(
          error.message
        );
      }
      
      // Generic error dengan pesan dari Error object
      return AuthResponseBuilder.createServerErrorResponse(
        error.message
      );
    }

    // Fallback untuk error yang tidak dikenal
    return AuthResponseBuilder.createServerErrorResponse(
      defaultMessage
    );
  }

  /**
   * Handle validation error khusus
   */
  static handleValidationError(
    error: unknown,
    context: ErrorContext
  ): NextResponse {
    console.error(`Validation error at ${context.endpoint}:`, {
      error: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString(),
    });

    const message = error instanceof Error 
      ? error.message 
      : "Data yang dikirim tidak valid";

    return AuthResponseBuilder.createValidationErrorResponse(message);
  }

  /**
   * Handle authentication error khusus
   */
  static handleAuthenticationError(
    error: unknown,
    context: ErrorContext,
    customMessage?: string
  ): NextResponse {
    // Reduced verbosity logging untuk authentication errors
    console.warn(`Authentication failed at ${context.endpoint}`, {
      timestamp: new Date().toISOString(),
      endpoint: context.endpoint,
    });

    // Generic message untuk menghindari eksposisi informasi sensitif
    const message = customMessage || "Email atau password salah";
    return AuthResponseBuilder.createAuthErrorResponse(message);
  }

  /**
   * Handle authorization error khusus
   */
  static handleAuthorizationError(
    error: unknown,
    context: ErrorContext,
    customMessage?: string
  ): NextResponse {
    console.error(`Authorization error at ${context.endpoint}:`, {
      error: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString(),
    });

    const message = customMessage || 
      (error instanceof Error ? error.message : "Access denied");

    return AuthResponseBuilder.createAuthorizationErrorResponse(message);
  }

  /**
   * Handle service error (dari authService)
   */
  static handleServiceError(
    error: unknown,
    context: ErrorContext,
    serviceName: string
  ): NextResponse {
    // Reduced verbosity logging untuk service errors
    if (error instanceof Error) {
      // Authentication errors - gunakan warn level dan generic message
      if (error.message.includes('Password salah') || 
          error.message.includes('Token tidak valid') ||
          error.message.includes('User tidak ditemukan')) {
        console.warn(`Authentication failed in ${serviceName}`, {
          timestamp: new Date().toISOString(),
          endpoint: context.endpoint,
        });
        
        // Return 401 untuk authentication errors dengan generic message
        return AuthResponseBuilder.createAuthErrorResponse("Email atau password salah");
      }
      
      // Validation errors - tetap gunakan message spesifik untuk user experience
      if (error.message.includes('Email sudah terdaftar')) {
        console.info(`Validation error in ${serviceName}`, {
          timestamp: new Date().toISOString(),
          endpoint: context.endpoint,
        });
        return AuthResponseBuilder.createValidationErrorResponse("Email sudah terdaftar");
      }
    }

    // Server errors - log dengan detail untuk debugging
    console.error(`Service error in ${serviceName} at ${context.endpoint}:`, {
      error: error instanceof Error ? error.message : String(error),
      serviceName,
      timestamp: new Date().toISOString(),
    });

    return AuthResponseBuilder.createServerErrorResponse(
      "Terjadi kesalahan pada server"
    );
  }

  /**
   * Create error context dari request
   */
  static createErrorContext(
    endpoint: string,
    userAgent?: string | null,
    ip?: string,
    additionalContext?: Record<string, any>
  ): ErrorContext {
    return {
      endpoint,
      userAgent,
      ip: ip || "unknown",
      timestamp: new Date().toISOString(),
      ...additionalContext,
    };
  }

  /**
   * Log error tanpa mengembalikan response (untuk debugging)
   */
  static logError(
    error: unknown,
    context: ErrorContext,
    level: 'error' | 'warn' | 'info' = 'error'
  ): void {
    const logData = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    };

    switch (level) {
      case 'error':
        console.error(`Error at ${context.endpoint}:`, logData);
        break;
      case 'warn':
        console.warn(`Warning at ${context.endpoint}:`, logData);
        break;
      case 'info':
        console.info(`Info at ${context.endpoint}:`, logData);
        break;
    }
  }
}