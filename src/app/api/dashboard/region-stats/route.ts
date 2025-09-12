import { NextRequest, NextResponse } from "next/server";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";
import { dashboardService } from "@/services/dashboardService";

/**
 * GET /api/dashboard/region-stats
 * Mengambil statistik per region dari database real
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - user harus login
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Ambil statistik region dari access logs real
    const regionStats = await dashboardService.getRegionStatsFromLogs();
    
    return NextResponse.json(regionStats);
  } catch (error) {
    console.error('Error fetching region stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil statistik region' 
      },
      { status: 500 }
    );
  }
}