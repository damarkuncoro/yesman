import { NextRequest, NextResponse } from "next/server";
import { routeFeatureService } from "@/services";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { createRouteFeatureSchema } from "@/services/rbac/types";
import { z } from "zod";

/**
 * Handler untuk mendapatkan daftar semua route-feature mappings
 * Memerlukan permission 'route_management' dengan action 'read'
 */
async function handleGetRouteFeatures(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing route-features list:', authenticatedUser);
    
    // Ambil semua route-feature mappings
    const routeFeatures = await routeFeatureService.getAllRouteMappings();
    
    return NextResponse.json({
      success: true,
      data: {
        routeFeatures,
      },
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get route-features error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk membuat route-feature mapping baru
 * Memerlukan permission 'route_management' dengan action 'create'
 */
async function handleCreateRouteFeature(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user creating new route-feature:', authenticatedUser);
    
    // Parse request body
    const body = await request.json();
    console.log('Create route-feature request body:', body);
    
    // Validasi input dengan Zod
    const validatedData = createRouteFeatureSchema.parse(body);
    
    // Buat route-feature mapping baru
    const newRouteFeature = await routeFeatureService.createRouteMapping(validatedData);
    
    return NextResponse.json({
      success: true,
      data: newRouteFeature,
      message: "Route-feature mapping berhasil dibuat"
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Data tidak valid",
        errors: error.issues
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Create route-feature error:', error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat membuat route-feature mapping"
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper untuk otorisasi
export const GET = withFeature({ feature: 'route_management', action: 'read' })(handleGetRouteFeatures);
export const POST = withFeature({ feature: 'route_management', action: 'create' })(handleCreateRouteFeature);