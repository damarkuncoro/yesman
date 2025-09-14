import { NextResponse } from 'next/server';
import { ApiResponse, ErrorContext } from '../types';

/**
 * Base Response Builder untuk membuat response API yang konsisten
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * dan Template Method Pattern
 */
export abstract class BaseResponseBuilder<T = any> {
  /**
   * Membuat success response dengan format standar
   * @param data - Data yang akan dikembalikan
   * @param message - Pesan sukses (opsional)
   * @param status - HTTP status code (default: 200)
   * @returns NextResponse dengan format ApiResponse
   */
  protected createSuccessResponse(
    data: T,
    message: string = 'Success',
    status: number = 200
  ): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Membuat error response dengan format standar
   * @param message - Pesan error
   * @param status - HTTP status code (default: 400)
   * @param errorDetails - Detail error tambahan
   * @returns NextResponse dengan format ApiResponse
   */
  protected createErrorResponse(
    message: string,
    status: number = 400,
    errorDetails?: string
  ): NextResponse<ApiResponse<null>> {
    const response: ApiResponse<null> = {
      success: false,
      message,
      error: errorDetails || message
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Membuat validation error response
   * @param errors - Array error validasi
   * @param message - Pesan error utama
   * @returns NextResponse dengan format ApiResponse
   */
  protected createValidationErrorResponse(
    errors: string[],
    message: string = 'Validation failed'
  ): NextResponse<ApiResponse<null>> {
    const errorDetails = `${message}: ${errors.join(', ')}`;
    return this.createErrorResponse(message, 422, errorDetails);
  }

  /**
   * Membuat unauthorized error response
   * @param message - Pesan error (opsional)
   * @returns NextResponse dengan format ApiResponse
   */
  protected createUnauthorizedResponse(
    message: string = 'Unauthorized access'
  ): NextResponse<ApiResponse<null>> {
    const response = this.createErrorResponse(message, 401, 'Access denied');
    
    // Jika error adalah "Token tidak ditemukan", tambahkan header untuk redirect
    if (message.includes('Token tidak ditemukan')) {
      response.headers.set('X-Redirect-To', '/login');
      response.headers.set('X-Redirect-Reason', 'token-not-found');
    }
    
    return response;
  }

  /**
   * Membuat forbidden error response
   * @param message - Pesan error (opsional)
   * @returns NextResponse dengan format ApiResponse
   */
  protected createForbiddenResponse(
    message: string = 'Forbidden access'
  ): NextResponse<ApiResponse<null>> {
    return this.createErrorResponse(message, 403, 'Insufficient permissions');
  }

  /**
   * Membuat not found error response
   * @param resource - Nama resource yang tidak ditemukan
   * @returns NextResponse dengan format ApiResponse
   */
  protected createNotFoundResponse(
    resource: string = 'Resource'
  ): NextResponse<ApiResponse<null>> {
    return this.createErrorResponse(`${resource} not found`, 404, `${resource} not found`);
  }

  /**
   * Membuat server error response
   * @param message - Pesan error (opsional)
   * @param error - Error object untuk logging
   * @returns NextResponse dengan format ApiResponse
   */
  protected createServerErrorResponse(
    message: string = 'Internal server error',
    error?: Error
  ): NextResponse<ApiResponse<null>> {
    // Log error untuk debugging
    if (error) {
      console.error('Server Error:', error);
    }

    return this.createErrorResponse(message, 500, 'An unexpected error occurred');
  }
}

/**
 * Generic Response Builder untuk penggunaan umum
 */
export class ResponseBuilder<T = any> extends BaseResponseBuilder<T> {
  /**
   * Public method untuk membuat success response
   */
  public success(
    data: T,
    message?: string,
    status?: number
  ): NextResponse<ApiResponse<T>> {
    return this.createSuccessResponse(data, message, status);
  }

  /**
   * Public method untuk membuat error response
   */
  public error(
    message: string,
    status?: number,
    errorDetails?: string
  ): NextResponse<ApiResponse<null>> {
    return this.createErrorResponse(message, status, errorDetails);
  }

  /**
   * Public method untuk membuat validation error response
   */
  public validationError(
    errors: string[],
    message?: string
  ): NextResponse<ApiResponse<null>> {
    return this.createValidationErrorResponse(errors, message);
  }

  /**
   * Public method untuk membuat unauthorized response
   */
  public unauthorized(message?: string): NextResponse<ApiResponse<null>> {
    return this.createUnauthorizedResponse(message);
  }

  /**
   * Public method untuk membuat forbidden response
   */
  public forbidden(message?: string): NextResponse<ApiResponse<null>> {
    return this.createForbiddenResponse(message);
  }

  /**
   * Public method untuk membuat not found response
   */
  public notFound(resource?: string): NextResponse<ApiResponse<null>> {
    return this.createNotFoundResponse(resource);
  }

  /**
   * Public method untuk membuat server error response
   */
  public serverError(
    message?: string,
    error?: Error
  ): NextResponse<ApiResponse<null>> {
    return this.createServerErrorResponse(message, error);
  }
}

/**
 * Factory function untuk membuat ResponseBuilder instance
 */
export function createResponseBuilder<T = any>(): ResponseBuilder<T> {
  return new ResponseBuilder<T>();
}

/**
 * Default ResponseBuilder instance untuk penggunaan langsung
 */
export const responseBuilder = createResponseBuilder();