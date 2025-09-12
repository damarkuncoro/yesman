import { NextRequest, NextResponse } from "next/server";
import { roleService } from "@/services/rbacService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * GET /api/rbac/roles
 * Mengambil semua role dalam sistem
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

    const roles = await roleService.getAllRoles();
    
    return NextResponse.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data role' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rbac/roles
 * Membuat role baru
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check - hanya admin yang bisa membuat role
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const body = await request.json();
    const newRole = await roleService.createRole(body);
    
    return NextResponse.json({
      success: true,
      data: newRole,
      message: 'Role berhasil dibuat'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat role' 
      },
      { status: 400 }
    );
  }
}