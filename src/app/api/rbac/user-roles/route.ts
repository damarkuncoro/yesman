import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * POST /api/rbac/user-roles
 * Assign role ke user
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check - hanya admin yang bisa assign role
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const body = await request.json();
    const userRole = await userRoleService.assignRole(body);
    
    return NextResponse.json({
      success: true,
      data: userRole,
      message: 'Role berhasil di-assign ke user'
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat assign role' 
      },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/rbac/user-roles
 * Remove role dari user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authorization check - hanya admin yang bisa remove role
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const body = await request.json();
    const { userId, roleId } = body;
    
    if (!userId || !roleId) {
      return NextResponse.json(
        { success: false, message: 'userId dan roleId harus diisi' },
        { status: 400 }
      );
    }

    const removed = await userRoleService.removeRole(userId, roleId);
    
    if (removed) {
      return NextResponse.json({
        success: true,
        message: 'Role berhasil di-remove dari user'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Gagal remove role dari user' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat remove role' 
      },
      { status: 400 }
    );
  }
}