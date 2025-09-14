import { NextRequest } from "next/server";
import { DashboardHandlers } from "../../_shared";

/**
 * GET /api/dashboard/feature-access-stats
 * Mengambil statistik akses feature
 * 
 * Implementasi SOLID principles:
 * - Single Responsibility: Handler memiliki satu tanggung jawab
 * - Open/Closed: Terbuka untuk ekstensi, tertutup untuk modifikasi
 * - Dependency Inversion: Bergantung pada abstraksi handler
 */

// Buat handler menggunakan factory pattern
const featureAccessStatsHandler = DashboardHandlers.getFeatureAccessStats();

/**
 * GET handler untuk feature access statistics
 */
export async function GET(request: NextRequest) {
  return featureAccessStatsHandler.handle(request);
}