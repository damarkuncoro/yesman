import { NextRequest } from "next/server";
import { DashboardHandlers } from "../../../_shared";

/**
 * GET /api/dashboard/department-stats
 * Mengambil statistik per department dari database real
 * 
 * Implementasi SOLID principles:
 * - Single Responsibility: Handler fokus pada department stats
 * - Open/Closed: Dapat diperluas tanpa mengubah implementasi
 * - Dependency Inversion: Menggunakan abstraksi handler
 */

// Buat handler menggunakan factory pattern
const departmentStatsHandler = DashboardHandlers.getDepartmentStats();

/**
 * GET handler untuk department statistics
 */
export async function GET(request: NextRequest) {
  return departmentStatsHandler.handle(request);
}