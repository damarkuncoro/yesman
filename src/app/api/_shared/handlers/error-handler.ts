import { NextResponse } from "next/server";
import { ErrorContext } from '../types';
import { AuthResponseBuilder, authResponseBuilder } from '../auth/auth-response-builder';
import { ResponseBuilder } from '../builders/ResponseBuilder';

/**
 * Class untuk menangani error secara terpusat dengan auth-specific logic
 * Extends shared ResponseBuilder untuk konsistensi
 * Menerapkan Single Responsibility Principle (SRP)
 */
class AuthErrorHandlerClass extends ResponseBuilder {
  /**
   * Handle error khusus auth dengan context logging
   */
  handleAuthError(
    error: unknown,
    context: ErrorContext,
    defaultMessage: string = "Terjadi kesalahan pada server"
  ): NextResponse {
    // Log error untuk debugging
    this.logError(error, context);

    // Tentukan response berdasarkan jenis error
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('validation') || error.message.includes('Validation')) {
        return this.validationError([error.message]);
      }
      
      if (error.message.includes('authentication') || error.message.includes('Authentication')) {
        return this.unauthorized(error.message);
      }
      
      if (error.message.includes('authorization') || error.message.includes('Authorization')) {
        return this.forbidden(error.message);
      }
      
      // Generic error dengan pesan dari Error object
      return this.error(error.message, 500);
    }

    // Fallback untuk error yang bukan Error object
    return this.error(defaultMessage, 500);
  }

  /**
   * Log error dengan context yang lengkap
   */
  logError(
    error: unknown,
    context: ErrorContext,
    level: 'error' | 'warn' | 'info' = 'error'
  ): void {
    console[level](`Error at ${context.endpoint}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

// Instance untuk penggunaan modern
const authErrorHandlerInstance = new AuthErrorHandlerClass();

/**
 * Legacy AuthErrorHandler untuk backward compatibility
 * @deprecated Gunakan authErrorHandlerInstance atau shared ResponseBuilder
 */
export class AuthErrorHandler {
  static handleError(
    error: unknown,
    context: ErrorContext,
    defaultMessage: string = "Terjadi kesalahan pada server"
  ): NextResponse {
    return authErrorHandlerInstance.handleAuthError(error, context, defaultMessage);
  }

  static handleValidationError(
    error: unknown,
    context: ErrorContext
  ): NextResponse {
    authErrorHandlerInstance.logError(error, context);
    const message = error instanceof Error ? error.message : "Data yang dikirim tidak valid";
    return authErrorHandlerInstance.validationError([message]);
  }

  static handleAuthenticationError(
    error: unknown,
    context: ErrorContext,
    customMessage?: string
  ): NextResponse {
    authErrorHandlerInstance.logError(error, context, 'warn');
    const message = customMessage || "Email atau password salah";
    return authErrorHandlerInstance.unauthorized(message);
  }

  static handleAuthorizationError(
    error: unknown,
    context: ErrorContext,
    customMessage?: string
  ): NextResponse {
    authErrorHandlerInstance.logError(error, context);
    const message = customMessage || (error instanceof Error ? error.message : "Access denied");
    return authErrorHandlerInstance.forbidden(message);
  }

  static handleServiceError(
    error: unknown,
    context: ErrorContext,
    serviceName: string
  ): NextResponse {
    if (error instanceof Error) {
      // Authentication errors - Token tidak ditemukan
      if (error.message.includes('Token tidak ditemukan')) {
        authErrorHandlerInstance.logError(error, context, 'warn');
        return authErrorHandlerInstance.unauthorized("Token tidak ditemukan");
      }
      
      // Authentication errors - lainnya
      if (error.message.includes('Password salah') || 
          error.message.includes('Token tidak valid') ||
          error.message.includes('User tidak ditemukan')) {
        authErrorHandlerInstance.logError(error, context, 'warn');
        return authErrorHandlerInstance.unauthorized("Email atau password salah");
      }
      
      // Validation errors
      if (error.message.includes('Email sudah terdaftar')) {
        authErrorHandlerInstance.logError(error, context, 'info');
        return authErrorHandlerInstance.validationError(["Email sudah terdaftar"]);
      }
    }

    // Server errors
    authErrorHandlerInstance.logError(error, context);
    return authErrorHandlerInstance.error("Terjadi kesalahan pada server", 500);
  }

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

  static logError(
    error: unknown,
    context: ErrorContext,
    level: 'error' | 'warn' | 'info' = 'error'
  ): void {
    authErrorHandlerInstance.logError(error, context, level);
  }
}

// Export instance untuk penggunaan modern
export const authErrorHandler = authErrorHandlerInstance;
export default authErrorHandler;