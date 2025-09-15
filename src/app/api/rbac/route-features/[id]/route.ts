import { NextRequest, NextResponse } from "next/server";
import { routeFeatureService } from "@/services";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { createRouteFeatureSchema } from "@/services/rbac/types";
import { z } from "zod";

/**
 * Handler untuk mendapatkan detail route-feature mapping berdasarkan ID
 * Memerlukan permission 'route_management' dengan action 'read'
 */
async function handleGetRouteFeature(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract route-feature ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const routeFeatureIdStr = pathSegments[pathSegments.length - 1];
    const routeFeatureId = parseInt(routeFeatureIdStr);
    
    if (isNaN(routeFeatureId)) {
      return NextResponse.json({
        success: false,
        message: "ID route-feature tidak valid",
      }, { status: 400 });
    }
    
    // Ambil data route-feature mapping
    const routeFeature = await routeFeatureService.getRouteMappingById(routeFeatureId);
    
    if (!routeFeature) {
      return NextResponse.json({
        success: false,
        message: "Route-feature mapping tidak ditemukan",
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: routeFeature,
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get route-feature error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk mengupdate route-feature mapping berdasarkan ID
 * Memerlukan permission 'route_management' dengan action 'update'
 */
async function handleUpdateRouteFeature(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract route-feature ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const routeFeatureIdStr = pathSegments[pathSegments.length - 1];
    const routeFeatureId = parseInt(routeFeatureIdStr);
    
    if (isNaN(routeFeatureId)) {
      return NextResponse.json({
        success: false,
        message: "ID route-feature tidak valid",
      }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    console.log('Update route-feature request body:', body);
    
    // Validasi input dengan Zod
    const validatedData = createRouteFeatureSchema.parse(body);
    console.log('Validation successful:', validatedData);
    
    // Update route-feature mapping melalui service layer
    const updatedRouteFeature = await routeFeatureService.updateRouteMapping(routeFeatureId, validatedData);
    
    return NextResponse.json({
      success: true,
      data: updatedRouteFeature,
      message: "Route-feature mapping berhasil diupdate"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating route-feature:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Zod validation error:', error.issues);
      return NextResponse.json(
        { 
          success: false, 
          message: "Data tidak valid", 
          errors: error.issues 
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Terjadi kesalahan saat mengupdate route-feature mapping" 
      },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk menghapus route-feature mapping berdasarkan ID
 * Memerlukan permission 'route_management' dengan action 'delete'
 */
async function handleDeleteRouteFeature(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract route-feature ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const routeFeatureIdStr = pathSegments[pathSegments.length - 1];
    const routeFeatureId = parseInt(routeFeatureIdStr);
    
    if (isNaN(routeFeatureId)) {
      return NextResponse.json({
        success: false,
        message: "ID route-feature tidak valid",
      }, { status: 400 });
    }
    
    // Hapus route-feature mapping melalui service layer
    await routeFeatureService.deleteRouteMapping(routeFeatureId);
    
    return NextResponse.json({
      success: true,
      message: "Route-feature mapping berhasil dihapus"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting route-feature:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Terjadi kesalahan saat menghapus route-feature mapping" 
      },
      { status: 500 }
    );
  }
}

// Export handlers dengan authorization wrapper
export const GET = withFeature({ feature: 'route_management', action: 'read' })(handleGetRouteFeature);
export const PUT = withFeature({ feature: 'route_management', action: 'update' })(handleUpdateRouteFeature);
export const DELETE = withFeature({ feature: 'route_management', action: 'delete' })(handleDeleteRouteFeature);