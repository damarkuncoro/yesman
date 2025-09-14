import { NextRequest, NextResponse } from 'next/server';
import { getCorsConfig, isOriginAllowed, CorsConfig } from './corsConfig';

/**
 * Handler untuk menangani CORS (Cross-Origin Resource Sharing)
 * Mengikuti prinsip SRP (Single Responsibility Principle)
 */
export class CorsHandler {
  private config: CorsConfig;

  constructor() {
    this.config = getCorsConfig();
  }

  /**
   * Menangani preflight OPTIONS request untuk CORS
   * @param request - NextRequest object
   * @returns NextResponse - Response untuk preflight request
   */
  handlePreflightRequest(request: NextRequest): NextResponse {
    const origin = request.headers.get('origin');
    const response = new NextResponse(null, { status: 200 });

    // Set CORS headers untuk preflight
    this.setCorsHeaders(response, origin);
    
    // Set headers khusus untuk preflight
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return response;
  }

  /**
   * Menambahkan CORS headers ke response
   * @param response - NextResponse object
   * @param origin - Origin dari request
   */
  setCorsHeaders(response: NextResponse, origin: string | null): void {
    // Periksa apakah origin diizinkan
    if (origin && isOriginAllowed(origin, this.config)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    // Set allowed methods
    response.headers.set(
      'Access-Control-Allow-Methods',
      this.config.allowedMethods.join(', ')
    );

    // Set allowed headers
    response.headers.set(
      'Access-Control-Allow-Headers',
      this.config.allowedHeaders.join(', ')
    );

    // Set credentials
    if (this.config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Set additional security headers
    response.headers.set('Vary', 'Origin');
  }

  /**
   * Memeriksa apakah request adalah preflight OPTIONS request
   * @param request - NextRequest object
   * @returns boolean - True jika preflight request
   */
  isPreflightRequest(request: NextRequest): boolean {
    return (
      request.method === 'OPTIONS' &&
      request.headers.has('origin') &&
      request.headers.has('access-control-request-method')
    );
  }

  /**
   * Menangani CORS untuk request normal (bukan preflight)
   * @param request - NextRequest object
   * @param response - NextResponse object
   * @returns NextResponse - Response dengan CORS headers
   */
  handleCorsRequest(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');
    this.setCorsHeaders(response, origin);
    return response;
  }
}

/**
 * Factory function untuk membuat instance CorsHandler
 * Mengikuti prinsip DIP (Dependency Inversion Principle)
 * @returns CorsHandler - Instance baru dari CorsHandler
 */
export function createCorsHandler(): CorsHandler {
  return new CorsHandler();
}