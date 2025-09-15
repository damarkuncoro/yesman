import { NextRequest, NextResponse } from "next/server";
import { featureService } from "@/services";
import { roleFeatureRepository } from "@/repositories";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";
import { createFeatureSchema } from "@/services/rbac/types";

/**
 * GET /api/rbac/features
 * Mengambil semua feature dengan roleCount (hanya admin)
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

    // Ambil semua features
    const features = await featureService.getAllFeatures();
    
    // Tambahkan roleCount untuk setiap feature
    const featuresWithRoleCount = await Promise.all(
      features.map(async (feature) => {
        const roleCount = await roleFeatureRepository.countRolesByFeature(feature.id);
        return {
          ...feature,
          roleCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: featuresWithRoleCount
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