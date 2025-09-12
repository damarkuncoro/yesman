import { NextRequest, NextResponse } from "next/server";
import { dashboardService } from "@/services/dashboardService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * GET /api/dashboard/stats
 * Mengambil ringkasan statistik dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - user harus login
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Ambil data statistik dashboard
    const dashboardSummary = await dashboardService.getDashboardSummary();
    
    return NextResponse.json({
      success: true,
      data: dashboardSummary
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil statistik dashboard' 
      },
      { status: 500 }
    );
  }
}