/**
 * Compatibility layer untuk authorizationMiddleware yang lama
 * Menggunakan refactored middleware dengan interface yang sama
 */

import { NextRequest } from 'next/server';
import { createAuthorizationMiddleware, createRouteAuthorizationMiddleware } from './exports';
import { ActionType, AuthorizationOptions } from './types';

/**
 * Legacy AuthorizationMiddleware class untuk backward compatibility
 */
class AuthorizationMiddleware {
  private middlewareHandler = createAuthorizationMiddleware();

  /**
   * Authorize dengan options tertentu
   * @param request - NextRequest object
   * @param options - Authorization options
   * @returns Promise - Authorization context atau error response
   */
  async authorize(request: NextRequest, options?: AuthorizationOptions) {
    return await this.middlewareHandler.handle(request, options);
  }

  /**
   * Authorize berdasarkan route
   * @param request - NextRequest object
   * @param action - Action yang diperlukan
   * @returns Promise - Authorization context atau error response
   */
  async authorizeByRoute(request: NextRequest, action?: ActionType) {
    const middlewareOrchestrator = createRouteAuthorizationMiddleware();
    return await middlewareOrchestrator.handleRouteAuthorization(
      request,
      action || 'read'
    );
  }
}

// Export singleton instance untuk backward compatibility
export const authorizationMiddleware = new AuthorizationMiddleware();

// Export helper functions untuk backward compatibility
export { createAuthorizationMiddleware, createRouteAuthorizationMiddleware } from './exports';
export type { AuthorizationContext, ActionType, AuthorizationOptions } from './types';