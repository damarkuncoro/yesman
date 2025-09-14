/**
 * Validation Types
 * Interface dan type untuk validation dan error handling
 * Menerapkan Single Responsibility Principle (SRP)
 */

import { z } from "zod";

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
 * Type untuk validation schema
 */
export type ValidationSchema = z.ZodSchema<any>;