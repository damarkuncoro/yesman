import { NextRequest } from "next/server";
import { DashboardHandlers } from "../../_shared";

/**
 * GET /api/dashboard/department-region-stats
 * Mengambil statistik department/region
 * 
 * Implementasi SOLID principles:
 * - Single Responsibility: Handler khusus untuk department-region stats
 * - Open/Closed: Dapat diperluas tanpa mengubah kode existing
 * - Dependency Inversion: Menggunakan abstraksi handler
 */

// Buat handler menggunakan factory pattern
const departmentRegionStatsHandler = DashboardHandlers.getDepartmentRegionStats();

/**
 * GET handler untuk department region statistics
 */
export async function GET(request: NextRequest) {
  return departmentRegionStatsHandler.handle(request);
}