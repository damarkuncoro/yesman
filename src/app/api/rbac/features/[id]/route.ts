import { NextRequest, NextResponse } from 'next/server';
import { featureService } from '@/services/rbac/featureService';
import { roleFeatureService } from '@/services/rbac/roleFeatureService';
import { policyManagementService } from '@/services/abac/policyManagementService';
import { authorizationMiddleware } from '@/middleware/authorizationMiddleware';
import { BaseApiHandler } from '@/app/api/_shared/handlers/BaseApiHandler';
import { ApiResponse } from '@/app/api/_shared/types/api-types';

/**
 * Handler untuk mengambil detail feature berdasarkan ID
 * Menggabungkan data feature dengan roles dan policies yang terkait
 */
class FeatureDetailHandler extends BaseApiHandler {
  constructor() {
    super({
      requireAuth: true,
      requiredPermissions: ['admin']
    });
  }

  /**
   * Implementasi method execute yang required oleh BaseApiHandler
   * @param request - NextRequest object
   * @returns Promise<any> - Data response
   */
  protected async execute(request: NextRequest): Promise<any> {
    // Extract feature ID dari URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const featureIdStr = pathSegments[pathSegments.length - 1];
    const featureId = parseInt(featureIdStr, 10);
    
    if (isNaN(featureId)) {
      throw new Error('Feature ID harus berupa angka');
    }

    // Ambil detail feature
    const feature = await featureService.getFeatureById(featureId);
    if (!feature) {
      throw new Error('Feature tidak ditemukan');
    }

    // Ambil roles yang memiliki akses ke feature ini
    const roleFeatures = await roleFeatureService.getRolePermissionsWithFeatures(featureId);
    
    // Ambil policies yang terkait dengan feature ini
    const policies = await policyManagementService.getPoliciesByFeature(featureId);

    // Group roles by ID to avoid duplicates
    const uniqueRoles = new Map();
    roleFeatures.forEach((rf: any) => {
      const roleId = rf.role?.id || rf.roleId;
      const roleName = rf.role?.name || 'Unknown Role';
      
      if (!uniqueRoles.has(roleId)) {
        uniqueRoles.set(roleId, {
          id: roleId,
          name: roleName,
          permissions: {
            canCreate: rf.canCreate,
            canRead: rf.canRead,
            canUpdate: rf.canUpdate,
            canDelete: rf.canDelete
          }
        });
      } else {
        // Merge permissions if role already exists (take the most permissive)
        const existingRole = uniqueRoles.get(roleId);
        existingRole.permissions.canCreate = existingRole.permissions.canCreate || rf.canCreate;
        existingRole.permissions.canRead = existingRole.permissions.canRead || rf.canRead;
        existingRole.permissions.canUpdate = existingRole.permissions.canUpdate || rf.canUpdate;
        existingRole.permissions.canDelete = existingRole.permissions.canDelete || rf.canDelete;
      }
    });

    // Format response data
    return {
      id: feature.id,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      createdAt: feature.createdAt,
      roles: Array.from(uniqueRoles.values()),
      policies: policies.map((policy: any) => ({
        id: policy.id,
        attribute: policy.attribute,
        operator: policy.operator,
        value: policy.value,
        description: policy.description,
        createdAt: policy.createdAt
      }))
    };
  }
}

/**
 * GET /api/rbac/features/[id] - Mengambil detail feature lengkap
 * Requires: Admin authorization
 */
export async function GET(request: NextRequest) {
  const handler = new FeatureDetailHandler();
  return handler.handle(request);
}

/**
 * PUT /api/rbac/features/[id] - Update feature berdasarkan ID
 * Requires: Admin authorization
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check - hanya admin yang bisa mengupdate feature
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    });
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { id } = await params;
    const featureId = parseInt(id, 10);
    if (isNaN(featureId)) {
      return NextResponse.json(
        { success: false, message: 'Feature ID harus berupa angka' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedFeature = await featureService.updateFeature(featureId, body);
    
    return NextResponse.json({
      success: true,
      data: updatedFeature,
      message: 'Feature berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate feature' 
      },
      { status: error instanceof Error && error.message.includes('tidak ditemukan') ? 404 : 400 }
    );
  }
}