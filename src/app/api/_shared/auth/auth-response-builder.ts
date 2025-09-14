import { NextResponse } from "next/server";
import { ResponseBuilder } from "../builders/ResponseBuilder";
import { ApiResponse, TokenResponse, UserData } from '../types';
import setupService from '@/services/setup';

/**
 * Auth-specific Response Builder yang extends shared ResponseBuilder
 * Menambahkan method khusus untuk authentication responses
 */
class AuthResponseBuilderClass extends ResponseBuilder<any> {
  /**
   * Buat response sukses untuk login/register dengan token
   */
  createAuthSuccessResponse(
    message: string,
    authData: TokenResponse,
    status: number = 200
  ): NextResponse {
    const responseData = {
      user: authData.user,
      accessToken: authData.accessToken,
    };

    return this.success(responseData, message, status);
  }

  /**
   * Buat response sukses untuk refresh token
   */
  createRefreshSuccessResponse(
    user: UserData,
    accessToken: string
  ): NextResponse {
    const responseData = {
      user,
      accessToken,
    };

    return this.success(responseData, "Token berhasil diperbarui");
  }

  /**
   * Buat response untuk validation
   */
  createValidationResponse(
    hasAccess: boolean,
    data: any
  ): NextResponse {
    return this.success({
      hasAccess,
      ...data
    }, hasAccess ? "Access granted" : "Access denied");
  }

  /**
   * Auth-specific error responses
   */
  createAuthErrorResponse(
    message: string = "Authentication failed",
    errorDetails?: string
  ): NextResponse {
    return this.error(message, 401, errorDetails);
  }

  createAuthorizationErrorResponse(
    message: string = "Access denied",
    errorDetails?: string
  ): NextResponse {
    return this.forbidden(message);
  }
}

// Create singleton instance
const authResponseBuilderInstance = new AuthResponseBuilderClass();

/**
 * Legacy AuthResponseBuilder untuk backward compatibility
 * @deprecated Gunakan authResponseBuilderInstance atau shared ResponseBuilder
 */
export class AuthResponseBuilder {
  static async createAuthSuccessResponse(
    message: string,
    authData: TokenResponse,
    status: number = 200
  ): Promise<NextResponse> {
    console.log('🔍 Route discovery triggered after successful login');
    
    try {
      // Jalankan route discovery setelah login berhasil
      await setupService.runRouteDiscovery();
      console.log('✅ Route discovery completed after login');
    } catch (error) {
      console.error('❌ Error running route discovery after login:', error);
      // Tidak throw error agar login tetap berhasil
    }
    
    return authResponseBuilderInstance.createAuthSuccessResponse(message, authData, status);
  }

  static createRefreshSuccessResponse(
    user: UserData,
    accessToken: string
  ): NextResponse {
    return authResponseBuilderInstance.createRefreshSuccessResponse(user, accessToken);
  }

  static createSimpleSuccessResponse(
    message: string,
    status: number = 200
  ): NextResponse {
    return authResponseBuilderInstance.success(null, message, status);
  }

  static createValidationResponse(
    hasAccess: boolean,
    data: any
  ): NextResponse {
    return authResponseBuilderInstance.createValidationResponse(hasAccess, data);
  }

  static createErrorResponse(
    message: string,
    status: number = 400,
    error?: string
  ): NextResponse {
    return authResponseBuilderInstance.error(message, status, error);
  }

  static createAuthErrorResponse(
    message: string = "Authentication failed",
    error?: string
  ): NextResponse {
    return authResponseBuilderInstance.createAuthErrorResponse(message, error);
  }

  static createAuthorizationErrorResponse(
    message: string = "Access denied",
    error?: string
  ): NextResponse {
    return authResponseBuilderInstance.createAuthorizationErrorResponse(message, error);
  }

  static createValidationErrorResponse(
    message: string = "Validation failed",
    error?: string
  ): NextResponse {
    return authResponseBuilderInstance.error(message, 422, error);
  }

  static createServerErrorResponse(
    message: string = "Internal server error",
    error?: string
  ): NextResponse {
    return authResponseBuilderInstance.error(message, 500, error);
  }
}

// Export instance untuk penggunaan modern
export const authResponseBuilder = authResponseBuilderInstance;
export default authResponseBuilder;