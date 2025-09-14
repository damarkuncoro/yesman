/**
 * Handler Types
 * Interface dan type untuk request handlers dan configuration
 * Menerapkan Single Responsibility Principle (SRP)
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Interface untuk handler configuration
 */
export interface HandlerConfig {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  validateInput?: boolean;
}

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