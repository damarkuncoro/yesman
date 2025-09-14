import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ValidationResult, RequestContext } from '../types';

/**
 * Base Request Handler untuk parsing dan validasi request
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 */
export abstract class BaseRequestHandler {
  /**
   * Ekstraksi body dari request dengan error handling
   * @param request - NextRequest object
   * @returns Promise<any> - Parsed body atau null jika gagal
   */
  protected async parseRequestBody(request: NextRequest): Promise<any> {
    try {
      const contentType = request.headers.get('content-type');
      
      if (!contentType) {
        return null;
      }

      if (contentType.includes('application/json')) {
        return await request.json();
      }
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const body: Record<string, any> = {};
        
        for (const [key, value] of formData.entries()) {
          body[key] = value;
        }
        
        return body;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing request body:', error);
      return null;
    }
  }

  /**
   * Ekstraksi query parameters dari request
   * @param request - NextRequest object
   * @returns Record<string, string> - Query parameters
   */
  protected extractQueryParams(request: NextRequest): Record<string, string> {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  }

  /**
   * Ekstraksi headers yang diperlukan dari request
   * @param request - NextRequest object
   * @param requiredHeaders - Array nama header yang diperlukan
   * @returns Record<string, string | null> - Headers yang diekstrak
   */
  protected extractHeaders(
    request: NextRequest,
    requiredHeaders: string[] = []
  ): Record<string, string | null> {
    const headers: Record<string, string | null> = {};
    
    requiredHeaders.forEach(headerName => {
      headers[headerName] = request.headers.get(headerName);
    });
    
    return headers;
  }

  /**
   * Ekstraksi token dari Authorization header
   * @param request - NextRequest object
   * @returns string | null - Token atau null jika tidak ada
   */
  protected extractAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return null;
    }
    
    // Format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Ekstraksi IP address dari request
   * @param request - NextRequest object
   * @returns string - IP address
   */
  protected extractClientIP(request: NextRequest): string {
    // Cek berbagai header untuk IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('x-remote-addr');
    
    if (forwardedFor) {
      // x-forwarded-for bisa berisi multiple IP, ambil yang pertama
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (remoteAddr) {
      return remoteAddr;
    }
    
    // Fallback ke localhost jika tidak ada header IP
    return '127.0.0.1';
  }

  /**
   * Membuat request context untuk logging dan debugging
   * @param request - NextRequest object
   * @returns RequestContext - Context object
   */
  protected createRequestContext(request: NextRequest): RequestContext {
    return {
      userAgent: request.headers.get('user-agent'),
      ip: this.extractClientIP(request),
      endpoint: request.url,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validasi input menggunakan Zod schema
   * @param data - Data yang akan divalidasi
   * @param schema - Zod schema untuk validasi
   * @returns ValidationResult<T> - Hasil validasi
   */
  protected validateInput<T>(
    data: any,
    schema: z.ZodSchema<T>
  ): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: z.ZodIssue) => 
          `${err.path.join('.')}: ${err.message}`
        );
        return {
          success: false,
          error: errorMessages.join(', ')
        };
      }
      
      return {
        success: false,
        error: 'Validation failed'
      };
    }
  }

  /**
   * Sanitasi string input untuk mencegah XSS
   * @param input - String yang akan disanitasi
   * @returns string - String yang sudah disanitasi
   */
  protected sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/[<>"'&]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[match] || match;
      })
      .trim();
  }

  /**
   * Sanitasi object input secara rekursif
   * @param obj - Object yang akan disanitasi
   * @returns any - Object yang sudah disanitasi
   */
  protected sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      
      return sanitized;
    }
    
    return obj;
  }
}

/**
 * Generic Request Handler untuk penggunaan umum
 */
export class RequestHandler extends BaseRequestHandler {
  /**
   * Parse dan validasi request dengan schema
   * @param request - NextRequest object
   * @param schema - Zod schema untuk validasi (opsional)
   * @returns Promise<ValidationResult<T>> - Hasil parsing dan validasi
   */
  public async parseAndValidate<T>(
    request: NextRequest,
    schema?: z.ZodSchema<T>
  ): Promise<ValidationResult<T>> {
    try {
      const body = await this.parseRequestBody(request);
      
      if (!body) {
        return {
          success: false,
          error: 'Request body is required'
        };
      }
      
      // Sanitasi input
      const sanitizedBody = this.sanitizeObject(body);
      
      // Validasi dengan schema jika disediakan
      if (schema) {
        return this.validateInput(sanitizedBody, schema);
      }
      
      return {
        success: true,
        data: sanitizedBody as T
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse request'
      };
    }
  }

  /**
   * Ekstraksi semua data request (body, query, headers)
   * @param request - NextRequest object
   * @param requiredHeaders - Headers yang diperlukan
   * @returns Promise<object> - Object berisi semua data request
   */
  public async extractAllRequestData(
    request: NextRequest,
    requiredHeaders: string[] = []
  ): Promise<{
    body: any;
    query: Record<string, string>;
    headers: Record<string, string | null>;
    context: RequestContext;
  }> {
    const body = await this.parseRequestBody(request);
    const query = this.extractQueryParams(request);
    const headers = this.extractHeaders(request, requiredHeaders);
    const context = this.createRequestContext(request);
    
    return {
      body: body ? this.sanitizeObject(body) : null,
      query,
      headers,
      context
    };
  }
}

/**
 * Factory function untuk membuat RequestHandler instance
 */
export function createRequestHandler(): RequestHandler {
  return new RequestHandler();
}

/**
 * Default RequestHandler instance untuk penggunaan langsung
 */
export const requestHandler = createRequestHandler();