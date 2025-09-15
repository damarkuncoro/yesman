import { NextRequest, NextResponse } from 'next/server'
import { withFeature, getUserFromRequest } from '@/lib/withFeature'
import { db } from '@/db'
import { users, userRoles, roles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Handler untuk mengambil semua user yang memiliki role tertentu
 * Memerlukan permission 'role_management' dengan action 'read'
 */
async function handleGetRoleUsers(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const roleIdIndex = pathSegments.findIndex(segment => segment === 'roles') + 1;
    const roleIdStr = pathSegments[roleIdIndex];
    const roleId = parseInt(roleIdStr);
    
    if (isNaN(roleId)) {
      return NextResponse.json({
        success: false,
        message: "ID role tidak valid",
      }, { status: 400 });
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Verifikasi role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);
    
    if (role.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Role tidak ditemukan",
      }, { status: 404 });
    }

    // Ambil semua user yang memiliki role ini
    const userMappings = await db
      .select({
        id: users.id,
        username: users.name, // menggunakan name sebagai username
        email: users.email,
        fullName: users.name,
        status: users.active,
        assignedAt: users.createdAt // menggunakan user createdAt sebagai fallback
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, roleId))

    // Format response sesuai dengan interface UserMapping
    const formattedUsers = userMappings.map((user: any) => ({
      id: user.id.toString(),
      name: user.username, // nama user
      email: user.email,
      status: user.status ? 'active' : 'inactive',
      assignedAt: user.assignedAt?.toISOString() || new Date().toISOString(),
      assignedBy: 'system',
      expiresAt: null
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length,
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get role users error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk assign user ke role tertentu
 * Memerlukan permission 'role_management' dengan action 'create'
 */
async function handleAssignUserToRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const roleIdIndex = pathSegments.findIndex(segment => segment === 'roles') + 1;
    const roleIdStr = pathSegments[roleIdIndex];
    const roleId = parseInt(roleIdStr);
    
    if (isNaN(roleId)) {
      return NextResponse.json({
        success: false,
        message: "ID role tidak valid",
      }, { status: 400 });
    }
    const body = await request.json();
    const { userId } = body;

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({
        success: false,
        message: "ID user tidak valid",
      }, { status: 400 });
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Verifikasi role dan user exists
    const [role, user] = await Promise.all([
      db.select().from(roles).where(eq(roles.id, roleId)).limit(1),
      db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1)
    ]);
    
    if (role.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Role tidak ditemukan",
      }, { status: 404 });
    }

    if (user.length === 0) {
      return NextResponse.json({
        success: false,
        message: "User tidak ditemukan",
      }, { status: 404 });
    }

    // Check apakah user sudah memiliki role ini
    const existingUserRole = await db
      .select()
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, parseInt(userId)),
        eq(userRoles.roleId, roleId)
      ))
      .limit(1);

    if (existingUserRole.length > 0) {
      return NextResponse.json({
        success: false,
        message: "User sudah memiliki role ini",
      }, { status: 409 });
    }

    // Assign role ke user
    const newUserRole = await db
      .insert(userRoles)
      .values({
        userId: parseInt(userId),
        roleId: roleId
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        userRole: newUserRole[0],
      },
      message: 'User berhasil di-assign ke role'
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Assign user to role error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk remove user dari role tertentu
 * Memerlukan permission 'role_management' dengan action 'delete'
 */
async function handleRemoveUserFromRole(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    
    // Extract role ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const roleIdIndex = pathSegments.findIndex(segment => segment === 'roles') + 1;
    const roleIdStr = pathSegments[roleIdIndex];
    const roleId = parseInt(roleIdStr);
    
    if (isNaN(roleId)) {
      return NextResponse.json({
        success: false,
        message: "ID role tidak valid",
      }, { status: 400 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({
        success: false,
        message: "ID user tidak valid",
      }, { status: 400 });
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Remove user dari role
    const deletedUserRole = await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, parseInt(userId)),
        eq(userRoles.roleId, roleId)
      ))
      .returning();

    if (deletedUserRole.length === 0) {
      return NextResponse.json({
        success: false,
        message: "User role assignment tidak ditemukan",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User berhasil di-remove dari role",
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Remove user from role error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper
export const GET = withFeature({ feature: 'role_management', action: 'read' })(handleGetRoleUsers);
export const POST = withFeature({ feature: 'role_management', action: 'create' })(handleAssignUserToRole);
export const DELETE = withFeature({ feature: 'role_management', action: 'delete' })(handleRemoveUserFromRole);