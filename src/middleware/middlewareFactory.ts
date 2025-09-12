/**
 * Main factory untuk membuat middleware dengan dependency injection
 * Mengikuti prinsip Factory Pattern dan Dependency Inversion Principle
 */

import { MiddlewareOrchestrator, createMiddlewareOrchestrator } from './auth/middlewareOrchestrator';
import { createAuthHandler } from './auth/authHandler';
import { createAuthorizationHandler } from './auth/authorizationHandler';
import { createRouteHandler } from './route/routeHandler';
import { createContextFactory } from './context/contextFactory';
import { createRouteMatcher } from './utils/routeMatcher';
import { MiddlewareHandler } from './types';

/**
 * Main factory class untuk middleware
 */
export class MiddlewareFactory {
  private static instance: MiddlewareFactory;
  private middlewareOrchestrator: MiddlewareOrchestrator | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MiddlewareFactory {
    if (!MiddlewareFactory.instance) {
      MiddlewareFactory.instance = new MiddlewareFactory();
    }
    return MiddlewareFactory.instance;
  }

  /**
   * Create middleware orchestrator dengan semua dependencies
   * @returns MiddlewareOrchestrator - Configured middleware orchestrator
   */
  createMiddleware(): MiddlewareOrchestrator {
    if (!this.middlewareOrchestrator) {
      // Create dependencies
      const routeMatcher = createRouteMatcher();
      const contextFactory = createContextFactory();
      const authHandler = createAuthHandler(contextFactory);
      const authorizationHandler = createAuthorizationHandler();
      const routeHandler = createRouteHandler(
        routeMatcher,
        authHandler,
        authorizationHandler,
        contextFactory
      );

      // Create orchestrator dengan dependency injection
      this.middlewareOrchestrator = createMiddlewareOrchestrator(
        authHandler,
        authorizationHandler,
        routeHandler,
        contextFactory
      );
    }

    return this.middlewareOrchestrator;
  }

  /**
   * Reset factory (untuk testing)
   */
  reset(): void {
    this.middlewareOrchestrator = null;
  }
}

/**
 * Convenience function untuk mendapatkan middleware handler
 * @returns MiddlewareHandler - Configured middleware handler
 */
export function createAuthorizationMiddleware(): MiddlewareHandler {
  return MiddlewareFactory.getInstance().createMiddleware();
}

/**
 * Convenience function untuk route-based authorization
 * @returns MiddlewareOrchestrator - Configured middleware orchestrator
 */
export function createRouteAuthorizationMiddleware(): MiddlewareOrchestrator {
  return MiddlewareFactory.getInstance().createMiddleware();
}

// Export singleton instance untuk backward compatibility
export const middlewareFactory = MiddlewareFactory.getInstance();