import { NextRequest } from "next/server";
import { authService } from "@/lib/auth/authService";
import {
  AuthRequestHandler,
  AuthResponseBuilder,
  AuthCookieManager,
  AuthValidationHandler,
  AuthErrorHandler,
} from "../(_components)";

/**
 * API route untuk registrasi user baru
 * POST /api/auth/register
 * 
 * Body:
 * {
 *   "name": "string",
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
  const context = AuthRequestHandler.createRequestContext(request, "/api/auth/register");
  
  try {
    // Parse request body
    const body = await AuthRequestHandler.parseJsonBody(request);
    
    // Validasi input menggunakan validation handler
    const validation = AuthValidationHandler.validateRegisterData(body);
    if (!validation.success) {
      return AuthErrorHandler.handleValidationError(
        new Error(validation.error),
        context
      );
    }
    
    // Registrasi user melalui service layer
    const authResponse = await authService.register(validation.data!);
    
    // Buat response dengan token
    const response = AuthResponseBuilder.createAuthSuccessResponse(
      "Registrasi berhasil",
      authResponse,
      201
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
      "authService.register"
    );
  }
}