import { NextRequest } from "next/server";
import { DashboardHandlers } from "../../../_shared";

/**
 * GET /api/dashboard/access-denied-stats
 * Mengambil statistik access denied
 * 
 * Implementasi SOLID principles:
 * - Single Responsibility: Handler khusus untuk access denied stats
 * - Open/Closed: Dapat diperluas dengan formatter tambahan
 * - Dependency Inversion: Menggunakan abstraksi handler
 */

// Buat handler menggunakan factory pattern
const accessDeniedStatsHandler = DashboardHandlers.getAccessDeniedStats();

/**
 * GET handler untuk access denied statistics
 */
export async function GET(request: NextRequest) {
  return accessDeniedStatsHandler.handle(request);
}