import { NextRequest, NextResponse } from "next/server";
import { dashboardService } from "@/services/dashboardService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * GET /api/dashboard/department-region-stats
 * Mengambil statistik department/region
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - user harus login
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Ambil data statistik department/region
    const departmentRegionStats = await dashboardService.getDepartmentRegionStats();
    
    return NextResponse.json({
      success: true,
      data: departmentRegionStats
    });
  } catch (error) {
    console.error('Error fetching department region stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil statistik department/region' 
      },
      { status: 500 }
    );
  }
}