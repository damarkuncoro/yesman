/**
 * Route handler untuk middleware
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActionType, MiddlewareResult, RouteMatcher } from '../types';
import { AuthHandler } from '../auth/authHandler';
import { AuthorizationHandler } from '../auth/authorizationHandler';
import { ContextFactory } from '../types';

/**
 * Handler untuk route-based middleware logic
 */
export class RouteHandler {
  constructor(
    private routeMatcher: RouteMatcher,
    private authHandler: AuthHandler,
    private authorizationHandler: AuthorizationHandler,
    private contextFactory: ContextFactory
  ) {}

  /**
   * Handle route-based authorization
   * @param request - NextRequest object
   * @param action - Action yang diperlukan (optional, akan di-derive dari method jika tidak ada)
   * @returns Promise<MiddlewareResult> - Authorization context atau error response
   */
  async handleRouteAuthorization(
    request: NextRequest,
    action?: ActionType
  ): Promise<MiddlewareResult> {
    try {
      const { pathname } = request.nextUrl;
      
      // Skip middleware jika diperlukan
      if (this.routeMatcher.shouldSkipMiddleware(pathname)) {
        return NextResponse.next();
      }

      // Handle public routes
      if (this.routeMatcher.isPublicRoute(pathname)) {
        return NextResponse.next();
      }

      // Tentukan action dari HTTP method jika tidak disediakan
      const requiredAction = action || this.routeMatcher.getActionFromMethod(request.method);

      // Authenticate user
      const authResult = await this.authHandler.authenticateUser(request);
      
      if (!authResult.success || !authResult.userContext) {
        const error = authResult.error || new Error('Authentication gagal');
        return this.authHandler.handleAuthError(error);
      }

      // Authorize route access
      const authError = await this.authorizationHandler.validateRouteAuthorization(
        authResult.userContext,
        pathname,
        request.method,
        requiredAction
      );

      if (authError) {
        return authError;
      }

      // Create dan return authorization context
      return await this.contextFactory.createAuthorizationContext(authResult.userContext);
    } catch (error) {
      console.error('Route authorization error:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Terjadi kesalahan dalam proses authorization' 
        },
        { status: 500 }
      );
    }
  }

  /**
   * Create response headers dengan user context
   * @param context - Authorization context
   * @returns NextResponse - Response dengan headers yang sesuai
   */
  createResponseWithHeaders(context: any): NextResponse {
    const response = NextResponse.next();
    
    if (context.userId && context.userId > 0) {
      response.headers.set('x-auth-user-id', context.userId.toString());
      response.headers.set('x-auth-user-email', context.email);
      response.headers.set('x-auth-user-roles', JSON.stringify(context.roles));
    }
    
    return response;
  }

  /**
   * Handle middleware result dan create appropriate response
   * @param result - Result dari middleware
   * @returns NextResponse - Final response
   */
  handleMiddlewareResult(result: MiddlewareResult): NextResponse {
    // Jika result adalah NextResponse, return langsung
    if (result instanceof NextResponse) {
      return result;
    }

    // Jika result adalah AuthorizationContext, create response dengan headers
    return this.createResponseWithHeaders(result);
  }
}

/**
 * Factory function untuk membuat route handler
 */
export function createRouteHandler(
  routeMatcher: RouteMatcher,
  authHandler: AuthHandler,
  authorizationHandler: AuthorizationHandler,
  contextFactory: ContextFactory
): RouteHandler {
  return new RouteHandler(routeMatcher, authHandler, authorizationHandler, contextFactory);
}