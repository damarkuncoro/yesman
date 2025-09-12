import { NextRequest, NextResponse } from "next/server";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";
import { dashboardService } from "@/services/dashboardService";

/**
 * GET /api/dashboard/department-stats
 * Mengambil statistik per department dari database real
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - user harus login
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Ambil statistik department dari access logs real
    const departmentStats = await dashboardService.getDepartmentStatsFromLogs();
    
    return NextResponse.json(departmentStats);
  } catch (error) {
    console.error('Error fetching department stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil statistik department' 
      },
      { status: 500 }
    );
  }
}