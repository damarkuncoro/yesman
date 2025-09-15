import { NextRequest, NextResponse } from 'next/server'
import { roleService } from '@/services/rbac/roleService'
import { withFeature, getUserFromRequest } from '@/lib/withFeature'

/**
 * Handler untuk mendapatkan detail role berdasarkan ID
 * Memerlukan permission 'role_management' dengan action 'read'
 */
async function handleGetRoleById(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const roleIdStr = pathSegments[pathSegments.length - 1];
    const roleId = parseInt(roleIdStr);
    
    if (isNaN(roleId)) {
      return NextResponse.json({
        success: false,
        message: "ID role tidak valid",
      }, { status: 400 });
    }

    // Ambil detail role dari service
    const role = await roleService.getRoleById(roleId);
    
    if (!role) {
      return NextResponse.json({
        success: false,
        message: "Role tidak ditemukan",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        role,
      },
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get role by ID error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk mengupdate role berdasarkan ID
 * Memerlukan permission 'role_management' dengan action 'update'
 */
async function handleUpdateRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const roleIdStr = pathSegments[pathSegments.length - 1];
    const roleId = parseInt(roleIdStr);
    
    if (isNaN(roleId)) {
      return NextResponse.json({
        success: false,
        message: "ID role tidak valid",
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Validasi input
    if (!name || typeof name !== 'string') {
      return NextResponse.json({
        success: false,
        message: "Nama role wajib diisi dan harus berupa string",
      }, { status: 400 });
    }

    // Update role - biarkan roleService yang handle mapping grants_all
    const updatedRole = await roleService.updateRole(roleId, body);

    return NextResponse.json({
      success: true,
      data: {
        role: updatedRole,
      },
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Update role error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk menghapus role berdasarkan ID
 * Memerlukan permission 'role_management' dengan action 'delete'
 */
async function handleDeleteRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const roleIdStr = pathSegments[pathSegments.length - 1];
    const roleId = parseInt(roleIdStr);
    
    if (isNaN(roleId)) {
      return NextResponse.json({
        success: false,
        message: "ID role tidak valid",
      }, { status: 400 });
    }

    // Hapus role
    await roleService.deleteRole(roleId);

    return NextResponse.json({
      success: true,
      message: "Role berhasil dihapus",
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Delete role error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper
export const GET = withFeature({ feature: 'role_management', action: 'read' })(handleGetRoleById);
export const PUT = withFeature({ feature: 'role_management', action: 'update' })(handleUpdateRole);
export const DELETE = withFeature({ feature: 'role_management', action: 'delete' })(handleDeleteRole);