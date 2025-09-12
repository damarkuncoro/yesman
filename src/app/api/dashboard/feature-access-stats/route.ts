import { NextRequest, NextResponse } from "next/server";
import { dashboardService } from "@/services/dashboardService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * GET /api/dashboard/feature-access-stats
 * Mengambil statistik akses feature
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - user harus login
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Ambil data statistik akses feature
    const featureAccessStats = await dashboardService.getFeatureAccessStats();
    
    return NextResponse.json({
      success: true,
      data: featureAccessStats
    });
  } catch (error) {
    console.error('Error fetching feature access stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil statistik akses feature' 
      },
      { status: 500 }
    );
  }
}