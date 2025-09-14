import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "./BaseApiHandler";
import { ResponseBuilder } from "../builders/ResponseBuilder";
import { dashboardService } from "@/services";
import type { HandlerConfig } from "../types";

/**
 * Interface untuk dashboard service methods
 */
export interface DashboardServiceMethod {
  (): Promise<any>;
}

/**
 * Configuration untuk dashboard read handler
 */
export interface DashboardReadConfig {
  serviceMethod: keyof typeof dashboardService;
  errorMessage?: string;
  requireAuth?: boolean;
  validateInput?: boolean;
  requiredPermissions?: string[];
}

/**
 * Handler untuk operasi READ dashboard
 * Mengimplementasikan Single Responsibility Principle (SRP)
 * dan Dependency Inversion Principle (DIP)
 */
export class DashboardReadHandler extends BaseApiHandler {
  private serviceMethod: keyof typeof dashboardService;
  private errorMessage: string;
  private responseBuilder: ResponseBuilder;

  constructor(config: DashboardReadConfig) {
    const handlerConfig: HandlerConfig = {
      requireAuth: config.requireAuth ?? true,
      validateInput: config.validateInput ?? true,
      // Dashboard endpoints tidak memerlukan permission check karena sudah di-handle di level authorization
      requiredPermissions: config.requiredPermissions ?? []
    };
    super(handlerConfig);
    this.serviceMethod = config.serviceMethod;
    this.errorMessage = config.errorMessage || 'Terjadi kesalahan saat mengambil data dashboard';
    this.responseBuilder = new ResponseBuilder();
  }

  /**
   * Implementasi business logic untuk read operation
   */
  protected async execute(request: NextRequest): Promise<any> {
    // Validasi bahwa service method exists
    const method = dashboardService[this.serviceMethod];
    if (typeof method !== 'function') {
      throw new Error(`Service method '${String(this.serviceMethod)}' tidak ditemukan`);
    }

    // Execute service method
    const result = await (method as DashboardServiceMethod).call(dashboardService);
    
    return result;
  }

  /**
   * Override error response untuk dashboard-specific messages
   * Menggunakan shared ResponseBuilder untuk konsistensi
   */
  protected formatErrorResponse(error: unknown): NextResponse {
    console.error('Dashboard Read Error:', error);
    
    // Gunakan shared ResponseBuilder untuk konsistensi format
    return this.responseBuilder.error(this.errorMessage, 500);
  }
}

/**
 * Factory function untuk membuat dashboard read handler
 * Mengimplementasikan Factory Pattern
 */
export function createDashboardReadHandler(
  serviceMethod: keyof typeof dashboardService,
  errorMessage?: string
): DashboardReadHandler {
  return new DashboardReadHandler({
    serviceMethod,
    errorMessage
  });
}

/**
 * Predefined handlers untuk dashboard endpoints yang umum
 */
export const DashboardHandlers = {
  /**
   * Handler untuk dashboard summary stats
   */
  getSummaryStats: () => createDashboardReadHandler(
    'getDashboardSummary',
    'Terjadi kesalahan saat mengambil ringkasan dashboard'
  ),

  /**
   * Handler untuk user role stats
   */
  getUserRoleStats: () => createDashboardReadHandler(
    'getUserRoleStats',
    'Terjadi kesalahan saat mengambil statistik user per role'
  ),

  /**
   * Handler untuk feature access stats
   */
  getFeatureAccessStats: () => createDashboardReadHandler(
    'getFeatureAccessStats',
    'Terjadi kesalahan saat mengambil statistik akses feature'
  ),

  /**
   * Handler untuk access denied stats
   */
  getAccessDeniedStats: () => createDashboardReadHandler(
    'getAccessDeniedStats',
    'Terjadi kesalahan saat mengambil statistik akses yang ditolak'
  ),

  /**
   * Handler untuk department stats
   */
  getDepartmentStats: () => createDashboardReadHandler(
    'getDepartmentStatsFromLogs',
    'Terjadi kesalahan saat mengambil statistik department'
  ),

  /**
   * Handler untuk region stats
   */
  getRegionStats: () => createDashboardReadHandler(
    'getRegionStatsFromLogs',
    'Terjadi kesalahan saat mengambil statistik region'
  ),

  getDepartmentRegionStats: () => createDashboardReadHandler(
    'getDepartmentRegionStats',
    'Terjadi kesalahan saat mengambil statistik department dan region'
  )
};