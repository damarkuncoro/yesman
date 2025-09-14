/**
 * Dashboard BaseApiHandler - Legacy compatibility layer
 * 
 * @deprecated Use shared BaseApiHandler from @/app/api/_shared instead
 * This file is kept for backward compatibility during refactoring
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  BaseApiHandler as SharedBaseApiHandler,
  ApiResponse,
  HandlerConfig,
  DEFAULT_DASHBOARD_CONFIG
} from "@/app/api/_shared";

/**
 * Dashboard-specific BaseApiHandler yang extends shared BaseApiHandler
 * Menggunakan shared components untuk konsistensi dan DRY principle
 */
export abstract class BaseApiHandler extends SharedBaseApiHandler {
  constructor(config: HandlerConfig = {}) {
    // Merge dengan default dashboard config
    const dashboardConfig = {
      ...DEFAULT_DASHBOARD_CONFIG,
      ...config
    };
    super(dashboardConfig);
  }
}

// Re-export types untuk backward compatibility
export type { ApiResponse, HandlerConfig };