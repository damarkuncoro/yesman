import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Interface untuk response API yang konsisten di seluruh aplikasi
 * Menerapkan Interface Segregation Principle (ISP)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Interface untuk data user yang dikembalikan dari API
 */
export interface UserData {
  id: number;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

/**
 * Interface untuk response dengan token
 */
export interface TokenResponse {
  user: UserData;
  accessToken: string;
  refreshToken: string;
}

/**
 * Interface untuk cookie configuration
 */
export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

/**
 * Interface untuk request context (logging dan debugging)
 */
export interface RequestContext {
  userAgent?: string | null;
  ip: string;
  endpoint: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Interface untuk validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Interface untuk error context
 */
export interface ErrorContext {
  endpoint: string;
  userAgent?: string | null;
  ip: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Interface untuk handler configuration
 */
export interface HandlerConfig {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  validateInput?: boolean;
}

/**
 * Type untuk validation schema
 */
export type ValidationSchema = z.ZodSchema<any>;

/**
 * Type untuk request handler
 */
export type RequestHandler = (
  request: NextRequest
) => Promise<NextResponse>;

/**
 * Type untuk service method
 */
export type ServiceMethod = () => Promise<any>;