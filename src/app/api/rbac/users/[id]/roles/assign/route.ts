import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { z } from "zod";

/**
 * Schema validasi untuk assign role
 */
const assignRoleSchema = z.object({
  roleId: z.number().int().positive("Role ID harus berupa integer positif")
});

/**
 * Handler untuk assign role ke user tertentu
 * Memerlukan permission 'user_management' dengan action 'update'
 */
async function handleAssignRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user assigning role:', authenticatedUser);

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
    const validatedData = assignRoleSchema.parse(body);
    
    const userRole = await userRoleService.assignRole({
      userId,
      roleId: validatedData.roleId
    });
    
    return NextResponse.json({
      success: true,
      data: userRole,
      message: 'Role berhasil di-assign ke user'
    }, { status: 201 });
    
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
    
    console.error('Assign role error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat assign role'
    }, { status: 500 });
  }
}

// Export handler dengan withFeature wrapper untuk otorisasi
export const POST = withFeature({ feature: 'user_management', action: 'update' })(handleAssignRole);