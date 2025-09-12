import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services";
import {
  AuthRequestHandler,
  AuthResponseBuilder,
  AuthCookieManager,
  AuthValidationHandler,
  AuthErrorHandler,
} from "../(_components)";

/**
 * API route untuk refresh access token
 * POST /api/auth/refresh
 * 
 * Menggunakan refresh token dari cookie untuk generate access token baru
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "string",
 *     "user": { ... }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const context = AuthRequestHandler.createRequestContext(request, "/api/auth/refresh");
  
  try {
    // Ambil refresh token dari cookie
    const refreshToken = AuthRequestHandler.getRefreshTokenFromCookie(request);
    
    // Validasi refresh token
    const validation = AuthValidationHandler.validateRefreshToken(refreshToken);
    if (!validation.success) {
      return AuthErrorHandler.handleAuthenticationError(
        new Error(validation.error),
        context
      );
    }
    
    // Generate access token baru menggunakan refresh token
    const refreshResponse = await authService.refreshAccessToken(validation.data!);
    
    // Buat response dengan access token baru
    const response = NextResponse.json({
      success: true,
      message: "Token berhasil diperbarui",
      data: {
        accessToken: refreshResponse.accessToken
      }
    }, { status: 200 });
    
    // Refresh token tetap sama, set ulang cookie
    return AuthCookieManager.setRefreshTokenOnResponse(
      response,
      validation.data!
    );
    
  } catch (error) {
    return AuthErrorHandler.handleServiceError(
      error,
      context,
      "authService.refreshAccessToken"
    );
  }
}