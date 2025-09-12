import { NextRequest, NextResponse } from "next/server";
import { featureService } from "@/services/rbacService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * GET /api/rbac/features
 * Mengambil semua feature dalam sistem
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

    const features = await featureService.getAllFeatures();
    
    return NextResponse.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data feature' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rbac/features
 * Membuat feature baru
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check - hanya admin yang bisa membuat feature
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const body = await request.json();
    const newFeature = await featureService.createFeature(body);
    
    return NextResponse.json({
      success: true,
      data: newFeature,
      message: 'Feature berhasil dibuat'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat feature' 
      },
      { status: 400 }
    );
  }
}