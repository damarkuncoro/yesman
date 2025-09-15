import { NextRequest, NextResponse } from "next/server";
import setupService from "@/services/setup";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * POST /api/v1/admin/route-discovery
 * Endpoint untuk menjalankan route discovery secara manual
 * Hanya bisa diakses oleh admin
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check - hanya admin yang bisa mengakses
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    console.log('🔍 Manual route discovery triggered by admin');
    
    // Jalankan route discovery
    await setupService.runRouteDiscovery();
    
    return NextResponse.json({
      success: true,
      message: 'Route discovery berhasil dijalankan. Lihat console untuk detail.'
    });
    
  } catch (error) {
    console.error('Error running route discovery:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menjalankan route discovery' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/route-discovery
 * Endpoint untuk mendapatkan status route discovery
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - hanya admin yang bisa mengakses
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Dynamic import untuk mendapatkan discovered routes
    const { routeDiscovery } = await import('@/services');
    
    const discoveredRoutes = await routeDiscovery.getDiscoveredRoutes();
    const registeredRoutes = await routeDiscovery.getAllRoutes();
    
    return NextResponse.json({
      success: true,
      data: {
        discovered: discoveredRoutes,
        registered: registeredRoutes,
        stats: {
          discoveredCount: discoveredRoutes.length,
          registeredCount: registeredRoutes.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting route discovery status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil status route discovery' 
      },
      { status: 500 }
    );
  }
}