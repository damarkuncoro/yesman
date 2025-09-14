import { NextRequest } from "next/server";
import { authService } from "@/services";
import {
  AuthRequestHandler,
  AuthResponseBuilder,
  AuthValidationHandler,
  AuthErrorHandler,
} from "../../_shared";

/**
 * API route untuk validasi akses user
 * POST /api/auth/validate
 * 
 * Body:
 * {
 *   "feature": "string",
 *   "action": "string",
 *   "resource": "string" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "hasAccess": boolean,
 *     "user": { ... },
 *     "permissions": [...]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const context = AuthRequestHandler.createRequestContext(request, "/api/auth/validate");
  
  try {
    // Parse request body
    const body = await AuthRequestHandler.parseJsonBody(request);
    
    // Validasi input menggunakan validation handler
    const validation = AuthValidationHandler.validateAccessData(body);
    if (!validation.success) {
      return AuthErrorHandler.handleValidationError(
        new Error(validation.error),
        context
      );
    }
    
    // Ambil access token dari header Authorization
    const accessToken = AuthRequestHandler.getAccessTokenFromHeader(request);
    
    // Validasi access token
    const tokenValidation = AuthValidationHandler.validateAccessToken(accessToken);
    if (!tokenValidation.success) {
      return AuthErrorHandler.handleAuthenticationError(
        new Error(tokenValidation.error),
        context
      );
    }
    
    // Validasi akses user menggunakan checkPermission
    const hasAccess = await authService.checkPermission(
      validation.data!.userId,
      validation.data!.route,
      validation.data!.action
    );
    
    // Buat response dengan hasil validasi
    return AuthResponseBuilder.createValidationResponse(
      hasAccess,
      {
        hasAccess,
        userId: validation.data!.userId,
        route: validation.data!.route,
        action: validation.data!.action,
        timestamp: new Date().toISOString()
      }
    );
    
  } catch (error) {
    return AuthErrorHandler.handleServiceError(
      error,
      context,
      "authService.checkPermission"
    );
  }
}