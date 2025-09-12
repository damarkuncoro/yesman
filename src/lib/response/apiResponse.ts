import { NextResponse } from "next/server";
import type { NextApiResponse } from "next";
import type { ApiResponse, ErrorResponse, SuccessResponse } from "../types";

/**
 * Response utility untuk App Router (Next.js 13+)
 * Menyediakan format response yang konsisten dan error handling otomatis
 * Mengikuti prinsip Single Responsibility - hanya menangani response formatting
 */
export class AppRouterResponse {
  /**
   * Format response sukses untuk App Router
   * @param data - Data yang akan dikembalikan
   * @param status - HTTP status code (default: 200)
   * @param meta - Metadata tambahan (opsional)
   * @returns NextResponse dengan format standar
   */
  static success<T>(data: T, status = 200, meta?: Record<string, any>): NextResponse {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      ...(meta ? { meta } : {})
    };
    
    return NextResponse.json(response, { status });
  }

  /**
   * Format response error untuk App Router
   * @param message - Pesan error (default: "Terjadi kesalahan pada server")
   * @param status - HTTP status code (default: 500)
   * @param errors - Detail error tambahan (opsional)
   * @returns NextResponse dengan format error standar
   */
  static error(
    message = "Terjadi kesalahan pada server", 
    status = 500, 
    errors?: any
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...(errors ? { errors } : {})
    };
    
    return NextResponse.json(response, { status });
  }

  /**
   * Wrapper untuk menangani error secara otomatis di App Router
   * Menghindari penulisan try-catch berulang di setiap route handler
   * @param fn - Function handler yang akan di-wrap
   * @returns Function yang sudah ter-wrap dengan error handling
   */
  static handle<T extends (...args: any[]) => Promise<Response>>(fn: T) {
    return async (...args: Parameters<T>): Promise<Response> => {
      try {
        return await fn(...args);
      } catch (err: any) {
        console.error("❌ API Error:", err);
        return AppRouterResponse.error(
          err.message ?? "Internal Server Error", 
          err.statusCode ?? 500
        );
      }
    };
  }
}

/**
 * Response utility untuk Pages Router (Next.js 12 dan sebelumnya)
 * Menyediakan format response yang konsisten untuk API routes lama
 * Mengikuti prinsip Single Responsibility - hanya menangani response formatting
 */
export class PagesRouterResponse {
  /**
   * Format response sukses untuk Pages Router
   * @param res - NextApiResponse object
   * @param data - Data yang akan dikembalikan
   * @param status - HTTP status code (default: 200)
   * @param meta - Metadata tambahan (opsional)
   */
  static success<T>(
    res: NextApiResponse, 
    data: T, 
    status = 200, 
    meta?: Record<string, any>
  ): void {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      ...(meta ? { meta } : {})
    };
    
    res.status(status).json(response);
  }

  /**
   * Format response error untuk Pages Router
   * @param res - NextApiResponse object
   * @param message - Pesan error (default: "Terjadi kesalahan pada server")
   * @param status - HTTP status code (default: 500)
   * @param errors - Detail error tambahan (opsional)
   */
  static error(
    res: NextApiResponse,
    message = "Terjadi kesalahan pada server", 
    status = 500, 
    errors?: any
  ): void {
    const response: ErrorResponse = {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...(errors ? { errors } : {})
    };
    
    res.status(status).json(response);
  }

  /**
   * Wrapper untuk menangani error secara otomatis di Pages Router
   * @param fn - Function handler yang akan di-wrap
   * @returns Function yang sudah ter-wrap dengan error handling
   */
  static handle(fn: (req: any, res: NextApiResponse) => Promise<void>) {
    return async (req: any, res: NextApiResponse): Promise<void> => {
      try {
        await fn(req, res);
      } catch (err: any) {
        console.error("❌ API Error:", err);
        PagesRouterResponse.error(
          res,
          err.message ?? "Internal Server Error",
          err.statusCode ?? 500
        );
      }
    };
  }
}

// Backward compatibility exports
export const API = AppRouterResponse;
export const API_Pages = PagesRouterResponse;