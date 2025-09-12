/**
 * Route matcher utility untuk middleware
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 */

import { ActionType, RouteMatcher } from '../types';

/**
 * Implementasi route matcher untuk menentukan routing logic
 */
export class DefaultRouteMatcher implements RouteMatcher {
  private readonly publicRoutes: string[] = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/health'
  ];

  private readonly skipPatterns: string[] = [
    '/_next/',
    '/api/auth/',
    '/favicon.ico'
  ];

  /**
   * Cek apakah route adalah public route
   * @param pathname - Path yang akan dicek
   * @returns boolean - true jika public route
   */
  isPublicRoute(pathname: string): boolean {
    return this.publicRoutes.includes(pathname);
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