import { NextRequest, NextResponse } from 'next/server';
import { featureService } from '@/services/rbac/featureService';
import { roleFeatureService } from '@/services/rbac/roleFeatureService';
import { policyManagementService } from '@/services/abac/policyManagementService';
import { withFeature, getUserFromRequest } from '@/lib/withFeature';
import { BaseApiHandler } from '@/app/api/_shared/handlers/BaseApiHandler';
import { ApiResponse } from '@/app/api/_shared/types/api-types';
import { z } from 'zod';

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
    const roleFeatures = await roleFeatureService.getFeaturePermissionsWithRoles(featureId);
    
    // Ambil policies yang terkait dengan feature ini
    const policies = await policyManagementService.getPoliciesByFeature(featureId);

    // Group roles by ID to avoid duplicates
    const uniqueRoles = new Map();
    roleFeatures.forEach((rf: any) => {
      const roleId = rf.role?.id || rf.roleId;
      const roleName = rf.role?.name || `Role ${roleId}`;
      
      console.log('API - Role feature data:', {
        roleId,
        roleName,
        roleData: rf.role,
        fullData: rf
      });
      
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
 * Handler untuk update feature berdasarkan ID
 * Memerlukan permission 'feature_management' dengan action 'update'
 */
async function handleUpdateFeature(
  request: NextRequest & { user?: any; params?: { id: string } }
): Promise<NextResponse> {
  try {
    const user = request.user;
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User tidak terautentikasi'
      }, { status: 401 });
    }

    const { id } = request.params || {};
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Feature ID diperlukan' },
        { status: 400 }
      );
    }
    
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
      data: {
        feature: updatedFeature,
      },
      message: 'Feature berhasil diupdate'
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
    }
    
    console.error('Update feature error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate feature'
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper untuk otorisasi
export const PUT = withFeature({ feature: 'feature_management', action: 'update' })(handleUpdateFeature);