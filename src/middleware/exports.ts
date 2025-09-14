/**
 * Main export file untuk middleware
 * Menyediakan interface yang clean untuk menggunakan middleware
 */

// Export main factory dan orchestrator
export { 
  MiddlewareFactory,
  createAuthorizationMiddleware,
  createRouteAuthorizationMiddleware,
  middlewareFactory
} from './middlewareFactory';

// Export types
export type {
  AuthorizationContext,
  ActionType,
  AuthorizationOptions,
  MiddlewareResult,
  MiddlewareHandler,
  RouteMatcher,
  ContextFactory
} from './types';

// Export individual handlers untuk advanced usage
export { AuthHandler, createAuthHandler } from './auth/authHandler';
export { AuthorizationHandler, createAuthorizationHandler } from './auth/authorizationHandler';
export { MiddlewareOrchestrator, createMiddlewareOrchestrator } from './auth/middlewareOrchestrator';
export { RouteHandler, createRouteHandler } from './route/routeHandler';
export { DefaultContextFactory, createContextFactory, contextFactory } from './context/contextFactory';

// Export CORS handler
export { CorsHandler, createCorsHandler } from './cors/corsHandler';
export { getCorsConfig, isOriginAllowed, developmentCorsConfig, productionCorsConfig } from './cors/corsConfig';
export type { CorsConfig } from './cors/corsConfig';
export { DefaultRouteMatcher, createRouteMatcher, routeMatcher } from './utils/routeMatcher';

// Convenience exports untuk backward compatibility
export { createAuthorizationMiddleware as default } from './middlewareFactory';