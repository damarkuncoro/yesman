import { NextRequest } from "next/server";
import { DashboardHandlers } from "../../_shared";

/**
 * GET /api/dashboard/stats
 * Mengambil ringkasan statistik dashboard
 * 
 * Menggunakan DashboardHandlers untuk implementasi SOLID principles:
 * - Single Responsibility: Handler hanya bertanggung jawab untuk satu operasi
 * - Open/Closed: Dapat diperluas tanpa mengubah kode existing
 * - Dependency Inversion: Bergantung pada abstraksi, bukan implementasi konkret
 */

// Buat handler menggunakan factory pattern
const statsHandler = DashboardHandlers.getSummaryStats();

/**
 * GET handler untuk dashboard summary statistics
 */
export async function GET(request: NextRequest) {
  return statsHandler.handle(request);
}