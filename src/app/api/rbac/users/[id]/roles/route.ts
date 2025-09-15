import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";

/**
 * Handler untuk mengambil semua role untuk user tertentu
 * Memerlukan permission 'user_management' dengan action 'read'
 */
async function handleGetUserRoles(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing user roles:', authenticatedUser);

    // Extract user ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userIdIndex = pathSegments.findIndex(segment => segment === 'users') + 1;
    const id = pathSegments[userIdIndex];
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'ID user tidak valid' },
        { status: 400 }
      );
    }

    const userRoles = await userRoleService.getUserRoles(userId);
    
    return NextResponse.json({
      success: true,
      data: userRoles
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
    }
    
    console.error('Get user roles error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data role user'
    }, { status: 500 });
  }
}

// Export handler dengan withFeature wrapper untuk otorisasi
export const GET = withFeature({ feature: 'user_management', action: 'read' })(handleGetUserRoles);