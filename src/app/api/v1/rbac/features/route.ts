import { NextRequest, NextResponse } from "next/server";
import { featureService } from "@/services";
import { roleFeatureRepository } from "@/repositories";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { createFeatureSchema } from "@/services/rbac/types";
import { z } from "zod";

/**
 * Handler untuk mendapatkan daftar semua feature dengan roleCount
 * Memerlukan permission 'feature_management' dengan action 'read'
 */
async function handleGetFeatures(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing features list:', authenticatedUser);
    
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
      data: {
        features: featuresWithRoleCount,
      },
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get features error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk membuat feature baru
 * Memerlukan permission 'feature_management' dengan action 'create'
 */
async function handleCreateFeature(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user creating new feature:', authenticatedUser);
    
    // Parse dan validasi request body
    const body = await request.json();
    const validatedData = createFeatureSchema.parse(body);
    
    // Buat feature baru
    const newFeature = await featureService.createFeature(validatedData);
    
    return NextResponse.json({
      success: true,
      data: {
        feature: newFeature,
      },
      message: 'Feature berhasil dibuat'
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Data tidak valid",
        errors: error.issues,
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Create feature error:', error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat membuat feature"
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper untuk otorisasi
export const GET = withFeature({ feature: 'feature_management', action: 'read' })(handleGetFeatures);
export const POST = withFeature({ feature: 'feature_management', action: 'create' })(handleCreateFeature);