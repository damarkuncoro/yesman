import { NextRequest, NextResponse } from "next/server";
import { roleFeatureService } from '@/services/rbac/roleFeatureService';
import { withFeature } from "@/lib/withFeature";
import type { AuthenticatedRequest } from "@/lib/auth/authMiddleware";
import { RBACError } from '@/services/rbac/types';


/**
 * Handler untuk mendapatkan features/permissions untuk role tertentu
 * Memerlukan permission 'role_management' dengan action 'read'
 */
async function handleGetRoleFeatures(request: AuthenticatedRequest): Promise<NextResponse> {
  // Extract params from URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const roleIdIndex = pathSegments.findIndex(segment => segment === 'roles') + 1;
  const roleIdParam = pathSegments[roleIdIndex];
  try {
    // User info sudah tersedia dari withFeature middleware
    const authenticatedUser = request.user;
    console.log('Authenticated user accessing role features:', authenticatedUser);

    const roleId = parseInt(roleIdParam)
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    // Ambil role features menggunakan service layer
    const roleFeaturesList = await roleFeatureService.getRolePermissionsWithFeatures(roleId);

    // Format data untuk frontend
    const formattedFeatures = roleFeaturesList.map((rf: any) => ({
      id: rf.id.toString(),
      featureId: rf.featureId,
      name: rf.featureName,
      description: rf.featureDescription,
      category: rf.featureCategory,
      canCreate: rf.canCreate,
      canRead: rf.canRead,
      canUpdate: rf.canUpdate,
      canDelete: rf.canDelete
    }))

    return NextResponse.json({
      success: true,
      data: {
        features: formattedFeatures
      }
    })
  } catch (error) {
    console.error('Error fetching role features:', error);
    
    // Handle RBACError (role tidak ditemukan)
    if (error instanceof RBACError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handler untuk menambah feature/permission ke role
 * Memerlukan permission 'role_management' dengan action 'create'
 */
async function handlePostRoleFeatures(request: AuthenticatedRequest): Promise<NextResponse> {
  // Extract params from URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const roleIdIndex = pathSegments.findIndex(segment => segment === 'roles') + 1;
  const roleIdParam = pathSegments[roleIdIndex];
  try {
    // User info sudah tersedia dari withFeature middleware
    const authenticatedUser = request.user;
    console.log('Authenticated user adding role features:', authenticatedUser);

    const roleId = parseInt(roleIdParam)
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { featureId, canCreate, canRead, canUpdate, canDelete } = body

    // Validasi input
    if (!featureId || typeof featureId !== 'number') {
      return NextResponse.json(
        { error: 'Feature ID is required and must be a number' },
        { status: 400 }
      )
    }

    // Set permission menggunakan service layer
    const newRoleFeature = await roleFeatureService.setPermission({
      roleId,
      featureId,
      canCreate: Boolean(canCreate),
      canRead: Boolean(canRead),
      canUpdate: Boolean(canUpdate),
      canDelete: Boolean(canDelete)
    });

    return NextResponse.json({
      success: true,
      data: {
        roleFeature: newRoleFeature
      }
    })
  } catch (error) {
    console.error('Error adding role feature:', error);
    
    // Handle RBACError (role/feature tidak ditemukan)
    if (error instanceof RBACError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers dengan withFeature wrapper
export const GET = withFeature({ feature: 'role_management', action: 'read' })(handleGetRoleFeatures);
export const POST = withFeature({ feature: 'role_management', action: 'create' })(handlePostRoleFeatures);