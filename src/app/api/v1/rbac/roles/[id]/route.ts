import { NextRequest, NextResponse } from "next/server";
import { roleService } from "@/services";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { z } from "zod";

/**
 * Handler untuk mengambil role berdasarkan ID
 * Memerlukan permission 'role_management' dengan action 'read'
 */
async function handleGetRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing role detail:', authenticatedUser);

    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
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
      data: {
        role,
      }
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: error.message.includes('tidak ditemukan') ? 404 : 500 });
    }
    
    console.error('Get role error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data role'
    }, { status: 500 });
  }
}

/**
 * Handler untuk update role berdasarkan ID
 * Memerlukan permission 'role_management' dengan action 'update'
 */
async function handleUpdateRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user updating role:', authenticatedUser);

    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
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
      data: {
        role: updatedRole,
      },
      message: 'Role berhasil diupdate'
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
    }
    
    console.error('Update role error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate role'
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper untuk otorisasi
export const GET = withFeature({ feature: 'role_management', action: 'read' })(handleGetRole);
export const PUT = withFeature({ feature: 'role_management', action: 'update' })(handleUpdateRole);
export const DELETE = withFeature({ feature: 'role_management', action: 'delete' })(handleDeleteRole);

/**
 * Handler untuk hapus role berdasarkan ID
 * Memerlukan permission 'role_management' dengan action 'delete'
 */
async function handleDeleteRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user deleting role:', authenticatedUser);

    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
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
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, message: 'Gagal menghapus role' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
    }
    
    console.error('Delete role error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus role'
    }, { status: 500 });
  }
}