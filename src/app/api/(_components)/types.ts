import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Interface untuk response API auth yang standar
 */
export interface AuthApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Interface untuk data user yang dikembalikan dari auth
 */
export interface AuthUserData {
  id: number;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

/**
 * Interface untuk response login/register
 */
export interface AuthTokenResponse {
  user: AuthUserData;
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
 * Interface untuk request handler context
 */
export interface RequestContext {
  userAgent?: string | null;
  ip: string;
  endpoint: string;
  timestamp: string;
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
 * Type untuk auth request handler function
 */
export type AuthRequestHandler = (
  request: NextRequest
) => Promise<NextResponse>;

/**
 * Type untuk validation schema
 */
export type ValidationSchema = z.ZodSchema<any>;

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