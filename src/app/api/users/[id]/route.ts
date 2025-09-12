import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/userService";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { userRepository } from "@/repositories";
import { db } from "@/db";
import { users, userRoles, roles, roleFeatures, features } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Handler untuk mendapatkan detail user berdasarkan ID
 * Memerlukan permission 'user_management' dengan action 'read'
 */
async function handleGetUserById(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract user ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userIdStr = pathSegments[pathSegments.length - 1];
    const userId = parseInt(userIdStr);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        message: "ID user tidak valid",
      }, { status: 400 });
    }
    
    // Ambil data user
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User tidak ditemukan",
      }, { status: 404 });
    }
    
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    // Ambil roles user
    const userRolesData = await db
      .select({
        roleId: userRoles.roleId,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    // Ambil permissions user
    const userPermissions = await db
      .select({
        featureId: features.id,
        featureName: features.name,
        featureDescription: features.description,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(roleFeatures, eq(roles.id, roleFeatures.roleId))
      .innerJoin(features, eq(roleFeatures.featureId, features.id))
      .where(eq(userRoles.userId, userId));
    
    // Format response data
    const userDetail = {
      ...user,
      roles: userRolesData.map(role => ({
        id: role.roleId.toString(),
        name: role.roleName,
        description: '',
      })),
      permissions: userPermissions.map(perm => ({
        featureId: perm.featureId.toString(),
        featureName: perm.featureName,
        featureDescription: perm.featureDescription || '',
      })),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        user: userDetail,
      },
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get user by ID error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk mengupdate user berdasarkan ID
 * Memerlukan permission 'user_management' dengan action 'update'
 */
async function handleUpdateUser(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract user ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userIdStr = pathSegments[pathSegments.length - 1];
    const userId = parseInt(userIdStr);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        message: "ID user tidak valid",
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, email, active } = body;
    
    // Validasi input
    if (!name || !email) {
      return NextResponse.json({
        success: false,
        message: "Nama dan email harus diisi",
      }, { status: 400 });
    }
    
    // Cek apakah user exists
    const existingUser = await userService.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: "User tidak ditemukan",
      }, { status: 404 });
    }
    
    // Update user
    const updatedUser = await userRepository.update(userId, {
      name,
      email,
      active: active !== undefined ? active : existingUser.active,
    });
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: "Gagal mengupdate user",
      }, { status: 500 });
    }
    
    // Return updated user tanpa password hash
    const { passwordHash, ...safeUser } = updatedUser;
    
    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
      },
      message: "User berhasil diupdate",
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Update user error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk menghapus user berdasarkan ID
 * Memerlukan permission 'user_management' dengan action 'delete'
 */
async function handleDeleteUser(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract user ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userIdStr = pathSegments[pathSegments.length - 1];
    const userId = parseInt(userIdStr);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        message: "ID user tidak valid",
      }, { status: 400 });
    }
    
    // Cek apakah user exists
    const existingUser = await userService.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: "User tidak ditemukan",
      }, { status: 404 });
    }
    
    // Soft delete dengan mengubah active menjadi false
    const deletedUser = await userRepository.update(userId, {
      active: false,
    });
    
    if (!deletedUser) {
      return NextResponse.json({
        success: false,
        message: "Gagal menghapus user",
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Delete user error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

// Export handlers dengan authorization wrapper
export const GET = withFeature({ feature: 'user_management', action: 'read' })(handleGetUserById);
export const PUT = withFeature({ feature: 'user_management', action: 'update' })(handleUpdateUser);
export const DELETE = withFeature({ feature: 'user_management', action: 'delete' })(handleDeleteUser);