import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { z } from "zod";

/**
 * Schema validasi untuk unassign role
 */
const unassignRoleSchema = z.object({
  roleId: z.number().int().positive("Role ID harus berupa integer positif")
});

/**
 * Handler untuk unassign role dari user tertentu
 * Memerlukan permission 'user_management' dengan action 'update'
 */
async function handleUnassignRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user unassigning role:', authenticatedUser);

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

    const body = await request.json();
    const validatedData = unassignRoleSchema.parse(body);
    
    const success = await userRoleService.removeRole(userId, validatedData.roleId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Role berhasil di-unassign dari user'
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal unassign role dari user' 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.issues
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Unassign role error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat unassign role'
    }, { status: 500 });
  }
}

// Export handler dengan withFeature wrapper untuk otorisasi
export const DELETE = withFeature({ feature: 'user_management', action: 'update' })(handleUnassignRole);