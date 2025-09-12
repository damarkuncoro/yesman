import { NextRequest, NextResponse } from "next/server";
import { authService, AuthErrorHandler } from "./authService";
import type { AuthenticatedUser, RbacAction } from "../types";

/**
 * Interface untuk authorization middleware options
 */
interface AuthMiddlewareOptions {
  feature: string;
  action: RbacAction;
  requireAuth?: boolean;
}

/**
 * Interface untuk authenticated request
 * Extends NextRequest dengan user information
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
  userId?: number;
}

/**
 * Utility untuk mengekstrak token dari request
 * @param req - NextRequest object
 * @returns Token string atau null jika tidak ada
 */
function extractTokenFromRequest(req: NextRequest): string | null {
  // Cek Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Cek cookie sebagai fallback
  const tokenCookie = req.cookies.get('token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Utility untuk mengekstrak user info dari headers
 * Digunakan ketika user info sudah di-inject oleh middleware sebelumnya
 * @param req - NextRequest object
 * @returns AuthenticatedUser object atau null
 */
function getUserFromHeaders(req: NextRequest): AuthenticatedUser | null {
  const userId = req.headers.get('x-user-id');
  const userEmail = req.headers.get('x-user-email');
  const userName = req.headers.get('x-user-name');
  const userActive = req.headers.get('x-user-active');

  if (userId && userEmail && userName) {
    return {
      id: parseInt(userId),
      email: userEmail,
      name: userName,
      active: userActive === 'true'
    };
  }

  return null;
}

/**
 * Higher-Order Function untuk authorization berbasis feature dan action
 * Menggunakan Hybrid RBAC + ABAC system untuk validasi lengkap
 * Menggantikan withFeature.ts dengan implementasi yang lebih modular
 * 
 * @param options - Configuration untuk authorization
 * @returns Function wrapper untuk API handler
 */
export function withAuthorization(options: AuthMiddlewareOptions) {
  const { feature, action, requireAuth = true } = options;

  return function (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      try {
        // Skip auth jika tidak diperlukan
        if (!requireAuth) {
          return await handler(req as AuthenticatedRequest);
        }

        // Cek apakah user info sudah ada di headers (dari middleware sebelumnya)
        let user = getUserFromHeaders(req);
        let userId: number;

        if (user) {
          userId = user.id;
        } else {
          // Ekstrak dan verifikasi token
          const token = extractTokenFromRequest(req);
          if (!token) {
            console.log('Token tidak ditemukan dalam request');
            return NextResponse.json(
              AuthErrorHandler.createErrorResponse(
                'Token tidak ditemukan', 
                401,
                {
                  endpoint: req.url,
                  method: req.method,
                  userAgent: req.headers.get('user-agent'),
                  timestamp: new Date().toISOString(),
                  details: 'Token tidak ditemukan dalam header Authorization atau cookie'
                }
              ),
              { status: 401 }
            );
          }

          // Verifikasi token
          const payload = await authService.verifyToken(token);
          if (!payload) {
            return NextResponse.json(
              AuthErrorHandler.createErrorResponse('Token tidak valid', 401),
              { status: 401 }
            );
          }

          userId = payload.userId;
          user = {
            id: payload.userId,
            email: payload.email,
            name: '', // Will be filled from user permission summary if needed
            active: true
          };
        }

        // Cek permission menggunakan Hybrid RBAC + ABAC
        const hasAccess = await authService.checkPermission(userId, feature, action);
        
        if (!hasAccess) {
          return NextResponse.json(
            AuthErrorHandler.createErrorResponse(
              `Akses ditolak: Tidak memiliki permission ${action} untuk ${feature}`,
              403
            ),
            { status: 403 }
          );
        }
        
        // Tambahkan user info ke request untuk digunakan di handler
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = user;
        authenticatedReq.userId = userId;
        
        // Tambahkan user info ke headers untuk kompatibilitas
        req.headers.set('x-user-id', userId.toString());
        req.headers.set('x-user-email', user.email);
        req.headers.set('x-user-name', user.name);
        req.headers.set('x-user-active', user.active.toString());
        
        console.log(`✅ Access granted: User ${userId} -> ${action} on ${feature}`);
        
        return await handler(authenticatedReq);
      } catch (error: any) {
        console.error('❌ Authorization middleware error:', error);
        return NextResponse.json(
          AuthErrorHandler.createErrorResponse(
            error.message || 'Internal server error',
            500
          ),
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Middleware untuk authentication saja (tanpa authorization)
 * Berguna untuk endpoint yang hanya perlu verifikasi user login
 * @param handler - API handler function
 * @returns Wrapped handler dengan authentication
 */
export function withAuthentication(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      // Cek apakah user info sudah ada di headers
      let user = getUserFromHeaders(req);
      let userId: number;

      if (user) {
        userId = user.id;
      } else {
        // Ekstrak dan verifikasi token
        const token = extractTokenFromRequest(req);
        if (!token) {
          return NextResponse.json(
            AuthErrorHandler.createErrorResponse(
              'Token tidak ditemukan', 
              401,
              {
                endpoint: req.url,
                method: req.method,
                userAgent: req.headers.get('user-agent'),
                timestamp: new Date().toISOString(),
                details: 'Token tidak ditemukan dalam header Authorization atau cookie',
                authFlow: 'authentication-only'
              }
            ),
            { status: 401 }
          );
        }

        // Verifikasi token
        const payload = await authService.verifyToken(token);
        if (!payload) {
          return NextResponse.json(
            AuthErrorHandler.createErrorResponse('Token tidak valid', 401),
            { status: 401 }
          );
        }

        userId = payload.userId;
        user = {
          id: payload.userId,
          email: payload.email,
          name: '',
          active: true
        };
      }

      // Tambahkan user info ke request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;
      authenticatedReq.userId = userId;
      
      // Tambahkan user info ke headers
      req.headers.set('x-user-id', userId.toString());
      req.headers.set('x-user-email', user.email);
      req.headers.set('x-user-name', user.name);
      req.headers.set('x-user-active', user.active.toString());
      
      console.log(`✅ User authenticated: ${user.email}`);
      
      return await handler(authenticatedReq);
    } catch (error: any) {
      console.error('❌ Authentication middleware error:', error);
      return NextResponse.json(
        AuthErrorHandler.createErrorResponse(
          error.message || 'Internal server error',
          500
        ),
        { status: 500 }
      );
    }
  };
}

// Backward compatibility exports
export const withFeature = withAuthorization;
export { extractTokenFromRequest, getUserFromHeaders };