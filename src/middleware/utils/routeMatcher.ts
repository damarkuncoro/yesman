/**
 * Route matcher utility untuk middleware
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 */

import { ActionType, RouteMatcher } from '../types';

/**
 * Implementasi route matcher untuk menentukan routing logic
 */
export class DefaultRouteMatcher implements RouteMatcher {
  /**
   * Public routes yang tidak memerlukan authentication untuk halaman web
   */
  private readonly publicRoutes: string[] = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ];

  /**
   * API routes yang tidak memerlukan authentication
   * Dipisah dari publicRoutes untuk kemudahan maintenance
   */
  private readonly publicApiRoutes: string[] = [
    '/api/health',
    '/api/version',
    // Legacy auth endpoints (non-versioned)
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/validate',
    // V1 auth endpoints
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/validate'
  ];

  /**
   * Patterns yang harus di-skip dari middleware processing
   */
  private readonly skipPatterns: string[] = [
    '/_next/',
    '/api/auth/',
    '/api/v1/auth/',
    '/favicon.ico',
    '/debug-features.html',
    '/test-features.html',
    '/debug-auth-flow.html',
  ];

  /**
   * Cek apakah route adalah public route (web pages atau API)
   * @param pathname - Path yang akan dicek
   * @returns boolean - true jika public route
   */
  isPublicRoute(pathname: string): boolean {
    return this.publicRoutes.includes(pathname) || this.publicApiRoutes.includes(pathname);
  }

  /**
   * Cek apakah route adalah public API route
   * @param pathname - Path yang akan dicek
   * @returns boolean - true jika public API route
   */
  isPublicApiRoute(pathname: string): boolean {
    return this.publicApiRoutes.includes(pathname);
  }

  /**
   * Cek apakah route adalah public web route
   * @param pathname - Path yang akan dicek
   * @returns boolean - true jika public web route
   */
  isPublicWebRoute(pathname: string): boolean {
    return this.publicRoutes.includes(pathname);
  }

  /**
   * Dapatkan semua public API routes
   * @returns string[] - Array of public API routes
   */
  getPublicApiRoutes(): string[] {
    return [...this.publicApiRoutes];
  }

  /**
   * Dapatkan semua public web routes
   * @returns string[] - Array of public web routes
   */
  getPublicWebRoutes(): string[] {
    return [...this.publicRoutes];
  }

  /**
   * Cek apakah middleware harus di-skip untuk route ini
   * @param pathname - Path yang akan dicek
   * @returns boolean - true jika harus di-skip
   */
  shouldSkipMiddleware(pathname: string): boolean {
    // Skip untuk static files dan Next.js internals
    if (pathname.includes('.') && !pathname.startsWith('/api/')) {
      return true;
    }

    // Skip berdasarkan pattern
    return this.skipPatterns.some(pattern => pathname.startsWith(pattern));
  }

  /**
   * Konversi HTTP method ke action type
   * @param method - HTTP method
   * @returns ActionType - Action yang sesuai
   */
  getActionFromMethod(method: string): ActionType {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'read';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'read'; // Default fallback
    }
  }
}

/**
 * Factory function untuk membuat route matcher
 * Memungkinkan dependency injection dan testing
 */
export function createRouteMatcher(): RouteMatcher {
  return new DefaultRouteMatcher();
}

/**
 * Singleton instance untuk penggunaan default
 */
export const routeMatcher = createRouteMatcher();