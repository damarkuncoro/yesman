import { NextRequest } from "next/server";
import { authService } from "@/services";
import {
  AuthRequestHandler,
  AuthResponseBuilder,
  AuthCookieManager,
  AuthValidationHandler,
  AuthErrorHandler,
} from "../../_shared";

/**
 * API route untuk logout user
 * POST /api/auth/logout
 * 
 * Menghapus refresh token dari database dan cookie
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Logout berhasil"
 * }
 */
export async function POST(request: NextRequest) {
  const context = AuthRequestHandler.createRequestContext(request, "/api/auth/logout");
  
  try {
    // Ambil refresh token dari cookie
    const refreshToken = AuthRequestHandler.getRefreshTokenFromCookie(request);
    
    // Validasi refresh token
    const validation = AuthValidationHandler.validateRefreshToken(refreshToken);
    if (validation.success && validation.data) {
      // Hapus session dari database jika token valid
      await authService.logout(validation.data);
    }
    
    // Buat response sukses
    const response = AuthResponseBuilder.createSimpleSuccessResponse(
      "Logout berhasil",
      200
    );
    
    // Hapus refresh token cookie
    return AuthCookieManager.clearRefreshTokenOnResponse(response);
    
  } catch (error) {
    // Tetap berhasil logout meskipun ada error di service
    // Karena yang penting adalah menghapus cookie di client
    AuthErrorHandler.logError(error, context, 'warn');
    
    const response = AuthResponseBuilder.createSimpleSuccessResponse(
      "Logout berhasil",
      200
    );
    
    return AuthCookieManager.clearRefreshTokenOnResponse(response);
  }
}