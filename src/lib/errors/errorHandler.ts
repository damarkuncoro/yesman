import { NextResponse } from "next/server";
import type { ApiResponse } from "../types";

/**
 * Interface untuk custom error dengan metadata
 * Mengikuti Interface Segregation Principle (ISP)
 */
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
  context?: Record<string, unknown>;
}

/**
 * Abstract base class untuk semua custom errors
 * Menerapkan Template Method Pattern dan Single Responsibility Principle
 */
export abstract class BaseError extends Error implements CustomError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean = true,
    details?: any,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.context = context;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON format untuk logging atau API response
   * Mengikuti Single Responsibility Principle
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      details: this.details,
      context: this.context,
      stack: this.stack,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Validation Error - untuk input validation
 * Mengikuti Single Responsibility Principle
 */
export class ValidationError extends BaseError {
  constructor(
    message: string = 'Data tidak valid',
    details?: any,
    context?: Record<string, unknown>
  ) {
    super(message, 400, 'VALIDATION_ERROR', true, details, context);
  }
}

/**
 * Authentication Error - untuk masalah autentikasi
 * Mengikuti Single Responsibility Principle
 */
export class AuthenticationError extends BaseError {
  constructor(
    message: string = 'Token tidak valid atau tidak ditemukan',
    context?: Record<string, unknown>
  ) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, undefined, context);
  }
}

/**
 * Authorization Error - untuk masalah otorisasi
 * Mengikuti Single Responsibility Principle
 */
export class AuthorizationError extends BaseError {
  constructor(
    message: string = 'Akses ditolak',
    details?: any,
    context?: Record<string, unknown>
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, details, context);
  }
}

/**
 * Not Found Error - untuk resource yang tidak ditemukan
 * Mengikuti Single Responsibility Principle
 */
export class NotFoundError extends BaseError {
  constructor(
    resource?: string,
    identifier?: string | number,
    context?: Record<string, unknown>
  ) {
    const message = resource && identifier 
      ? `${resource} dengan ID ${identifier} tidak ditemukan`
      : 'Resource tidak ditemukan';
    super(message, 404, 'NOT_FOUND', true, { resource, identifier }, context);
  }
}

/**
 * Conflict Error - untuk konflik data
 * Mengikuti Single Responsibility Principle
 */
export class ConflictError extends BaseError {
  constructor(
    resource?: string,
    field?: string,
    value?: string,
    context?: Record<string, unknown>
  ) {
    const message = resource && field && value
      ? `${resource} dengan ${field} '${value}' sudah ada`
      : 'Data sudah ada atau konflik';
    super(message, 409, 'CONFLICT', true, { resource, field, value }, context);
  }
}

/**
 * Rate Limit Error - untuk rate limiting
 * Mengikuti Single Responsibility Principle
 */
export class RateLimitError extends BaseError {
  constructor(
    message: string = 'Terlalu banyak request, coba lagi nanti',
    context?: Record<string, unknown>
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, undefined, context);
  }
}

/**
 * External Service Error - untuk error dari service eksternal
 * Mengikuti Single Responsibility Principle
 */
export class ExternalServiceError extends BaseError {
  constructor(
    serviceName?: string,
    operation?: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    const message = serviceName && operation
      ? `Service ${serviceName} error pada operasi ${operation}`
      : 'Service eksternal tidak tersedia';
    super(
      message,
      502,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { serviceName, operation, originalError: originalError?.message },
      context
    );
  }
}

/**
 * Database Error - untuk error database
 * Mengikuti Single Responsibility Principle
 */
export class DatabaseError extends BaseError {
  constructor(
    operation: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(
      `Database error pada operasi ${operation}`,
      500,
      'DATABASE_ERROR',
      true,
      { operation, originalError: originalError?.message },
      context
    );
  }
}

/**
 * Internal Server Error - untuk error yang tidak terduga
 * Mengikuti Single Responsibility Principle
 */
export class InternalServerError extends BaseError {
  constructor(
    message: string = 'Internal server error',
    context?: Record<string, unknown>
  ) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, undefined, context);
  }
}

/**
 * Error Handler Service - centralized error handling
 * Mengikuti Single Responsibility Principle dan Factory Pattern
 */
export class ErrorHandler {
  /**
   * Format error menjadi ApiResponse
   * Mengikuti Single Responsibility Principle
   */
  static formatError(error: unknown): ApiResponse {
    if (error instanceof BaseError) {
      return {
        success: false,
        message: error.message,
        errors: {
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
          timestamp: new Date().toISOString()
        }
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
        errors: {
          code: 'UNKNOWN_ERROR',
          statusCode: 500,
          timestamp: new Date().toISOString()
        }
      };
    }

    return {
      success: false,
      message: 'Terjadi kesalahan yang tidak diketahui',
      errors: {
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create NextResponse dari error
   * Mengikuti Single Responsibility Principle
   */
  static createErrorResponse(error: unknown): NextResponse {
    const formattedError = this.formatError(error);
    const statusCode = this.getStatusCode(error);
    return NextResponse.json(formattedError, { status: statusCode });
  }

  /**
   * Log error dengan context
   * Mengikuti Single Responsibility Principle
   */
  static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    
    if (error instanceof BaseError) {
      console.error(`${timestamp} ${contextStr} ${error.name}:`, {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        context: error.context,
        stack: error.stack
      });
    } else if (error instanceof Error) {
      console.error(`${timestamp} ${contextStr} Error:`, {
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error(`${timestamp} ${contextStr} Unknown Error:`, error);
    }
  }

  /**
   * Wrap async function dengan error handling
   * Mengikuti Decorator Pattern
   */
  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logError(error, context);
        throw this.handleError(error, context || 'Unknown operation');
      }
    };
  }

  /**
   * Handle error dan convert ke appropriate error type
   * Mengikuti Factory Pattern
   */
  static handleError(
    error: unknown,
    operation: string,
    context?: Record<string, unknown>
  ): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes('Token tidak ditemukan') || 
          error.message.includes('Token tidak valid') || 
          error.message.includes('Authentication diperlukan') ||
          error.message.includes('User tidak aktif')) {
        return new AuthenticationError(error.message, context);
      }
      
      // Database errors
      if (error.message.includes('database') || error.message.includes('ECONNREFUSED')) {
        return new DatabaseError(operation, error, context);
      }
      
      // Validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return new ValidationError(error.message, undefined, context);
      }
      
      return new InternalServerError(error.message, context);
    }

    return new InternalServerError('Unknown error occurred', context);
  }

  /**
   * Check if error is operational
   * Mengikuti Single Responsibility Principle
   */
  static isOperationalError(error: unknown): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Extract error message
   * Mengikuti Single Responsibility Principle
   */
  static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  /**
   * Extract status code from error
   * Mengikuti Single Responsibility Principle
   */
  static getStatusCode(error: unknown): number {
    if (error instanceof BaseError) {
      return error.statusCode;
    }
    return 500;
  }

  /**
   * Check if error is custom error
   * Mengikuti Single Responsibility Principle
   */
  static isCustomError(error: unknown): error is BaseError {
    return error instanceof BaseError;
  }
}

/**
 * Error utility functions untuk kemudahan penggunaan
 * Mengikuti Factory Pattern dan DRY principle
 */
export const errorUtils = {
  /**
   * Create validation error
   */
  validation: (message: string, details?: any, context?: Record<string, unknown>) => 
    new ValidationError(message, details, context),

  /**
   * Create authentication error
   */
  authentication: (message?: string, context?: Record<string, unknown>) => 
    new AuthenticationError(message, context),

  /**
   * Create authorization error
   */
  authorization: (message?: string, details?: any, context?: Record<string, unknown>) => 
    new AuthorizationError(message, details, context),

  /**
   * Create not found error
   */
  notFound: (resource?: string, identifier?: string | number, context?: Record<string, unknown>) => 
    new NotFoundError(resource, identifier, context),

  /**
   * Create conflict error
   */
  conflict: (resource?: string, field?: string, value?: string, context?: Record<string, unknown>) => 
    new ConflictError(resource, field, value, context),

  /**
   * Create rate limit error
   */
  rateLimit: (message?: string, context?: Record<string, unknown>) => 
    new RateLimitError(message, context),

  /**
   * Create external service error
   */
  externalService: (serviceName?: string, operation?: string, originalError?: Error, context?: Record<string, unknown>) => 
    new ExternalServiceError(serviceName, operation, originalError, context),

  /**
   * Create database error
   */
  database: (operation: string, originalError?: Error, context?: Record<string, unknown>) => 
    new DatabaseError(operation, originalError, context),

  /**
   * Create internal server error
   */
  internal: (message?: string, context?: Record<string, unknown>) => 
    new InternalServerError(message, context)
};

// Export default
export default ErrorHandler;

// Export semua error classes untuk backward compatibility
export {
  BaseError as AppError,
  AuthenticationError as UnauthorizedError,
  AuthorizationError as ForbiddenError
};