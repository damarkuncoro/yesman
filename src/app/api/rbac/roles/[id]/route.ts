import { NextRequest, NextResponse } from "next/server";
import { roleService } from "@/services/rbacService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * GET /api/rbac/roles/[id]
 * Mengambil role berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check - hanya admin yang bisa mengakses
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, message: 'ID role tidak valid' },
        { status: 400 }
      );
    }

    const role = await roleService.getRoleById(roleId);
    
    return NextResponse.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data role' 
      },
      { status: error instanceof Error && error.message.includes('tidak ditemukan') ? 404 : 500 }
    );
  }
}

/**
 * PUT /api/rbac/roles/[id]
 * Update role berdasarkan ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check - hanya admin yang bisa mengupdate role
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, message: 'ID role tidak valid' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedRole = await roleService.updateRole(roleId, body);
    
    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: 'Role berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate role' 
      },
      { status: error instanceof Error && error.message.includes('tidak ditemukan') ? 404 : 400 }
    );
  }
}

/**
 * DELETE /api/rbac/roles/[id]
 * Hapus role berdasarkan ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check - hanya admin yang bisa menghapus role
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, message: 'ID role tidak valid' },
        { status: 400 }
      );
    }

    const deleted = await roleService.deleteRole(roleId);
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Role berhasil dihapus'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Gagal menghapus role' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus role' 
      },
      { status: error instanceof Error && error.message.includes('tidak ditemukan') ? 404 : 400 }
    );
  }
}