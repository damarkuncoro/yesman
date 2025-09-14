import { NextRequest } from "next/server";
import { DashboardHandlers } from "../../_shared";

/**
 * GET /api/dashboard/user-role-stats
 * Mengambil statistik user per role
 * 
 * Implementasi SOLID principles:
 * - Single Responsibility: Handler fokus pada satu tugas
 * - Liskov Substitution: Handler dapat diganti dengan implementasi lain
 * - Interface Segregation: Interface yang spesifik untuk kebutuhan
 */

// Buat handler menggunakan factory pattern
const userRoleStatsHandler = DashboardHandlers.getUserRoleStats();

/**
 * GET handler untuk user role statistics
 */
export async function GET(request: NextRequest) {
  return userRoleStatsHandler.handle(request);
}