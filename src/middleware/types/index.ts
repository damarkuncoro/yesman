/**
 * Types dan interfaces untuk middleware authorization
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Interface untuk authorization context yang diberikan ke API routes
 */
export interface AuthorizationContext {
  userId: number;
  email: string;
  roles: string[];
  hasPermission: (featureName: string, action: ActionType) => Promise<boolean>;
  hasAnyRole: (roleNames: string[]) => Promise<boolean>;
  hasRole: (roleName: string) => Promise<boolean>;
}

/**
 * Type untuk action yang dapat dilakukan pada resource
 */
export type ActionType = 'create' | 'read' | 'update' | 'delete';

/**
 * Interface untuk options authorization middleware
 */
export interface AuthorizationOptions {
  requiredFeature?: string;
  requiredAction?: ActionType;
  requiredRoles?: string[];
  allowPublic?: boolean;
}

/**
 * Interface untuk route configuration
 */
export interface RouteConfig {
  path: string;
  method: string;
  action: ActionType;
  isPublic?: boolean;
}

/**
 * Type untuk middleware result
 */
export type MiddlewareResult = AuthorizationContext | NextResponse;

/**
 * Interface untuk middleware handler
 */
export interface MiddlewareHandler {
  handle(request: NextRequest, options?: AuthorizationOptions): Promise<MiddlewareResult>;
}

/**
 * Interface untuk route matcher
 */
export interface RouteMatcher {
  isPublicRoute(pathname: string): boolean;
  shouldSkipMiddleware(pathname: string): boolean;
  getActionFromMethod(method: string): ActionType;
}

/**
 * Interface untuk context factory
 */
export interface ContextFactory {
  createAuthorizationContext(userContext: any): Promise<AuthorizationContext>;
  createPublicContext(): AuthorizationContext;
}