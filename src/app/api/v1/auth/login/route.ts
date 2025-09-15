import { NextRequest } from "next/server";
import { authService } from "@/services";
import {
  AuthRequestHandler,
  AuthResponseBuilder,
  AuthCookieManager,
  AuthValidationHandler,
  AuthErrorHandler,
} from "../../../_shared";

/**
 * API route untuk login user
 * POST /api/v1/auth/login
 * 
 * Body:
 * {
 *   "email": "string",
 *   "password": "string"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... },
 *     "accessToken": "string"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const context = AuthRequestHandler.createRequestContext(request, "/api/auth/login");
  
  try {
    // Parse request body
    const body = await AuthRequestHandler.parseJsonBody(request);
    
    // Validasi input menggunakan validation handler
    const validation = AuthValidationHandler.validateLoginData(body);
    if (!validation.success) {
      return AuthErrorHandler.handleValidationError(
        new Error(validation.error),
        context
      );
    }
    
    // Login user melalui service layer
    const authResponse = await authService.login(validation.data!);
    
    // Buat response dengan token dan jalankan route discovery
    const response = await AuthResponseBuilder.createAuthSuccessResponse(
      "Login berhasil",
      authResponse,
      200
    );
    
    // Set refresh token cookie
    return AuthCookieManager.setRefreshTokenOnResponse(
      response,
      authResponse.refreshToken
    );
    
  } catch (error) {
    return AuthErrorHandler.handleServiceError(
      error,
      context,
      "authService.login"
    );
  }
}