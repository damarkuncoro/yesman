import { NextResponse } from "next/server";
import { AuthApiResponse, AuthTokenResponse, AuthUserData } from './types';

/**
 * Class untuk membangun response API yang konsisten
 * Menerapkan Single Responsibility Principle (SRP)
 */
export class AuthResponseBuilder {
  /**
   * Buat response sukses untuk login/register dengan token
   */
  static createAuthSuccessResponse(
    message: string,
    authData: AuthTokenResponse,
    status: number = 200
  ): NextResponse {
    const response: AuthApiResponse<{
      user: AuthUserData;
      accessToken: string;
    }> = {
      success: true,
      message,
      data: {
        user: authData.user,
        accessToken: authData.accessToken,
      },
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Buat response sukses untuk refresh token
   */
  static createRefreshSuccessResponse(
    user: AuthUserData,
    accessToken: string
  ): NextResponse {
    const response: AuthApiResponse<{
      user: AuthUserData;
      accessToken: string;
    }> = {
      success: true,
      message: "Token berhasil diperbarui",
      data: {
        user,
        accessToken,
      },
    };

    return NextResponse.json(response, { status: 200 });
  }

  /**
   * Buat response sukses sederhana (untuk logout, dll)
   */
  static createSimpleSuccessResponse(
    message: string,
    status: number = 200
  ): NextResponse {
    const response: AuthApiResponse = {
      success: true,
      message,
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Buat response sukses untuk validasi akses
   */
  static createValidationResponse(
    hasAccess: boolean,
    data: any
  ): NextResponse {
    const response: AuthApiResponse<any> = {
      success: true,
      message: hasAccess ? "Akses diizinkan" : "Akses ditolak",
      data: {
        hasAccess,
        ...data
      },
    };

    return NextResponse.json(response, { status: 200 });
  }

  /**
   * Buat response error
   */
  static createErrorResponse(
    message: string,
    status: number = 400,
    error?: string
  ): NextResponse {
    const response: AuthApiResponse = {
      success: false,
      message,
      error,
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Buat response error untuk authentication
   */
  static createAuthErrorResponse(
    message: string = "Authentication failed",
    error?: string
  ): NextResponse {
    return this.createErrorResponse(message, 401, error);
  }

  /**
   * Buat response error untuk authorization
   */
  static createAuthorizationErrorResponse(
    message: string = "Access denied",
    error?: string
  ): NextResponse {
    return this.createErrorResponse(message, 403, error);
  }

  /**
   * Buat response error untuk validation
   */
  static createValidationErrorResponse(
    message: string = "Validation failed",
    error?: string
  ): NextResponse {
    return this.createErrorResponse(message, 400, error);
  }

  /**
   * Buat response error untuk server error
   */
  static createServerErrorResponse(
    message: string = "Internal server error",
    error?: string
  ): NextResponse {
    return this.createErrorResponse(message, 500, error);
  }
}