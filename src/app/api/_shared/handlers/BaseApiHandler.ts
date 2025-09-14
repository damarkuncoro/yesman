import { NextRequest, NextResponse } from "next/server";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";
import { AuthorizationOptions, AuthorizationContext } from "@/middleware/authorizationMiddleware";
import { ApiResponse, HandlerConfig, RequestContext, ErrorContext } from "../types";

/**
 * Abstract base class untuk semua API handlers
 * Mengimplementasikan Template Method Pattern dan SOLID principles
 * - Single Responsibility: Menangani flow request/response yang konsisten
 * - Open/Closed: Dapat diperluas tanpa modifikasi
 * - Liskov Substitution: Subclass dapat menggantikan base class
 * - Interface Segregation: Interface yang spesifik untuk setiap kebutuhan
 * - Dependency Inversion: Bergantung pada abstraksi, bukan implementasi konkret
 */
export abstract class BaseApiHandler {
  protected config: HandlerConfig;

  constructor(config: HandlerConfig = {}) {
    this.config = {
      requireAuth: true,
      requiredPermissions: [],
      validateInput: false,
      ...config
    };
  }

  /**
   * Template method untuk menangani request
   * Mengimplementasikan Template Method Pattern
   */
  public async handle(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Authorization check
      if (this.config.requireAuth) {
        const authResult = await this.authorize(request);
        if (authResult instanceof NextResponse) {
          return authResult;
        }
      }

      // 2. Input validation
      if (this.config.validateInput) {
        const validationResult = await this.validateInput(request);
        if (validationResult instanceof NextResponse) {
          return validationResult;
        }
      }

      // 3. Execute business logic
      const result = await this.execute(request);

      // 4. Format success response
      return this.formatSuccessResponse(result);
    } catch (error) {
      // 5. Handle errors
      return this.formatErrorResponse(error, request);
    }
  }

  /**
   * Authorization check menggunakan middleware
   */
  protected async authorize(request: NextRequest): Promise<NextResponse | void> {
    if (this.config.requiredPermissions && this.config.requiredPermissions.length > 0) {
      const authOptions: AuthorizationOptions = {
        requiredRoles: this.config.requiredPermissions
      };
      const authResult = await authorizationMiddleware.authorize(request, authOptions);
      
      // Jika hasil adalah NextResponse (error), return error
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      
      // Jika hasil adalah AuthorizationContext (success), tidak return apa-apa
      // Method akan melanjutkan ke processRequest
    }
  }

  /**
   * Input validation - dapat di-override oleh subclass
   */
  protected async validateInput(request: NextRequest): Promise<NextResponse | void> {
    // Default implementation - no validation
    // Subclass dapat override method ini untuk validasi spesifik
    return;
  }

  /**
   * Abstract method untuk business logic - harus diimplementasikan oleh subclass
   */
  protected abstract execute(request: NextRequest): Promise<any>;

  /**
   * Format success response dengan struktur yang konsisten
   */
  protected formatSuccessResponse<T>(data: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      message: message || "Operasi berhasil",
      data,
    };

    return NextResponse.json(response, { status: 200 });
  }

  /**
   * Format error response dengan logging
   */
  protected formatErrorResponse(error: unknown, request?: NextRequest): NextResponse {
    const errorContext = this.createErrorContext(request);
    
    // Log error untuk debugging
    this.logError(error, errorContext);

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan pada server",
      error: error instanceof Error ? error.name : "UnknownError",
    };

    // Tentukan status code berdasarkan jenis error
    const statusCode = this.getErrorStatusCode(error);
    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Ekstrak query parameters dari request
   */
  protected getQueryParams(request: NextRequest): URLSearchParams {
    const url = new URL(request.url);
    return url.searchParams;
  }

  /**
   * Parse JSON body dari request
   */
  protected async getRequestBody<T>(request: NextRequest): Promise<T> {
    try {
      return await request.json();
    } catch (error) {
      throw new Error('Invalid JSON format in request body');
    }
  }

  /**
   * Ekstrak request context untuk logging
   */
  protected createRequestContext(request: NextRequest, endpoint: string): RequestContext {
    const userAgent = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    return {
      userAgent,
      ip,
      endpoint,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Buat error context untuk logging
   */
  protected createErrorContext(request?: NextRequest): ErrorContext {
    const userAgent = request?.headers.get("user-agent");
    const ip = request?.headers.get("x-forwarded-for") || 
               request?.headers.get("x-real-ip") || 
               "unknown";
    
    return {
      endpoint: request?.url || "unknown",
      userAgent,
      ip,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Log error dengan context
   */
  protected logError(error: unknown, context: ErrorContext): void {
    console.error(`Error at ${context.endpoint}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Tentukan status code berdasarkan jenis error
   */
  protected getErrorStatusCode(error: unknown): number {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('validation') || message.includes('invalid')) {
        return 400; // Bad Request
      }
      
      if (message.includes('authentication') || message.includes('unauthorized')) {
        return 401; // Unauthorized
      }
      
      if (message.includes('authorization') || message.includes('forbidden')) {
        return 403; // Forbidden
      }
      
      if (message.includes('not found')) {
        return 404; // Not Found
      }
    }
    
    return 500; // Internal Server Error
  }
}