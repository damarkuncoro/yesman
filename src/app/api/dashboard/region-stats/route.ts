import { NextRequest } from "next/server";
import { DashboardHandlers } from "../../_shared";

/**
 * GET /api/dashboard/region-stats
 * Mengambil statistik per region dari database real
 * 
 * Implementasi SOLID principles:
 * - Single Responsibility: Handler fokus pada region stats
 * - Open/Closed: Dapat diperluas tanpa mengubah implementasi
 * - Dependency Inversion: Menggunakan abstraksi handler
 */

// Buat handler menggunakan factory pattern
const regionStatsHandler = DashboardHandlers.getRegionStats();

/**
 * GET handler untuk region statistics
 */
export async function GET(request: NextRequest) {
  return regionStatsHandler.handle(request);
}