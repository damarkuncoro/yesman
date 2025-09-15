import { NextRequest, NextResponse } from 'next/server';
import { userRoleService } from '@/services';
import { withFeature, getUserFromRequest } from '@/lib/withFeature';
import { z } from 'zod';

/**
 * Schema validasi untuk update user roles
 */
const updateUserRolesSchema = z.object({
  roleIds: z.array(z.number().int().positive("Role ID harus berupa integer positif"))
    .min(0, "Minimal 0 role")
    .max(10, "Maksimal 10 role")
});

/**
 * Handler untuk mengambil roles untuk user tertentu
 * Memerlukan permission 'user_management' dengan action 'read'
 */
async function handleGetUserRoles(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing user roles:', authenticatedUser);

    // Extract user ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.findIndex(segment => segment === 'users') + 1];
    console.log('Extracted userId:', userId);
    
    // Validasi userId
    if (!userId || isNaN(Number(userId))) {
      console.error(`Invalid user ID: ${userId}`);
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    console.log(`Fetching roles for user ID: ${userId}`);
    const roles = await userRoleService.getUserRoles(parseInt(userId));
    console.log(`Found ${roles.length} roles for user ${userId}:`, roles);
    
    return NextResponse.json({
      success: true,
      data: { roles }
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('User roles error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Get user roles error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Handler untuk update roles user tertentu
 * Memerlukan permission 'user_management' dengan action 'update'
 */
async function handleUpdateUserRoles(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user updating user roles:', authenticatedUser);

    // Extract user ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.findIndex(segment => segment === 'users') + 1];
    console.log('Extracted userId:', userId);
    
    // Validasi userId
    if (!userId || isNaN(Number(userId))) {
      console.error(`Invalid user ID: ${userId}`);
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    // Validasi input dengan Zod
    const validatedData = updateUserRolesSchema.parse(body);
    console.log('Validated data:', validatedData);
    
    // Update user roles menggunakan service
    const result = await userRoleService.updateUserRoles(
      parseInt(userId), 
      validatedData.roleIds
    );
    
    console.log('Update user roles result:', result);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'User roles berhasil diupdate'
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.issues
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      console.error('Update user roles error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Update user roles error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate user roles'
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper untuk otorisasi
export const GET = withFeature({ feature: 'user_management', action: 'read' })(handleGetUserRoles);
export const PUT = withFeature({ feature: 'user_management', action: 'update' })(handleUpdateUserRoles);