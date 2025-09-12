/**
 * Middleware orchestrator yang mengintegrasikan semua handler
 * Mengikuti prinsip Dependency Injection dan Composition
 */

import { NextRequest } from 'next/server';
import { 
  AuthorizationOptions, 
  MiddlewareResult, 
  MiddlewareHandler,
  ActionType
} from '../types';
import { AuthHandler } from './authHandler';
import { AuthorizationHandler } from './authorizationHandler';
import { RouteHandler } from '../route/routeHandler';
import { ContextFactory } from '../types';

/**
 * Main middleware class yang mengintegrasikan semua handler
 * Mengikuti prinsip Single Responsibility dan Dependency Injection
 */
export class MiddlewareOrchestrator implements MiddlewareHandler {
  constructor(
    private authHandler: AuthHandler,
    private authorizationHandler: AuthorizationHandler,
    private routeHandler: RouteHandler,
    private contextFactory: ContextFactory
  ) {}

  /**
   * Handle middleware dengan options tertentu
   * @param request - NextRequest object
   * @param options - Authorization options
   * @returns Promise<MiddlewareResult> - Authorization context atau error response
   */
  async handle(
    request: NextRequest,
    options?: AuthorizationOptions
  ): Promise<MiddlewareResult> {
    try {
      // Handle public access jika diizinkan
      if (options?.allowPublic) {
        return this.authHandler.handlePublicAccess(options);
      }

      // Authenticate user
      const authResult = await this.authHandler.authenticateUser(request);
      
      if (!authResult.success || !authResult.userContext) {
        const error = authResult.error || new Error('Authentication gagal');
        return this.authHandler.handleAuthError(error);
      }

      // Authorize berdasarkan options
      const authError = await this.authorizationHandler.validateAuthorization(
        authResult.userContext,
        options
      );

      if (authError) {
        return authError;
      }

      // Create dan return authorization context
      return await this.contextFactory.createAuthorizationContext(authResult.userContext);
    } catch (error) {
      console.error('Middleware orchestrator error:', error);
      return this.authHandler.handleAuthError(new Error('Terjadi kesalahan dalam proses authorization'));
    }
  }

  /**
   * Handle route-based authorization
   * @param request - NextRequest object
   * @param action - Action yang diperlukan
   * @returns Promise<MiddlewareResult> - Authorization context atau error response
   */
  async handleRouteAuthorization(
    request: NextRequest,
    action: ActionType
  ): Promise<MiddlewareResult> {
    return await this.routeHandler.handleRouteAuthorization(request, action);
  }
}

/**
 * Factory function untuk membuat middleware orchestrator
 */
export function createMiddlewareOrchestrator(
  authHandler: AuthHandler,
  authorizationHandler: AuthorizationHandler,
  routeHandler: RouteHandler,
  contextFactory: ContextFactory
): MiddlewareOrchestrator {
  return new MiddlewareOrchestrator(
    authHandler,
    authorizationHandler,
    routeHandler,
    contextFactory
  );
}