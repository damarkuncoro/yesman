import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '@/services';
import { withFeature, getUserFromRequest } from '@/lib/withFeature';

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
    const userId = pathSegments[pathSegments.length - 1];
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
    const roles = await rbacService.getUserRoles(userId);
    console.log(`Found ${roles.length} roles for user ${userId}:`, roles);
    
    return NextResponse.json({
      success: true,
      data: { roles }
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('RBAC Error details:', {
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

// Export handler dengan withFeature wrapper untuk otorisasi
export const GET = withFeature({ feature: 'user_management', action: 'read' })(handleGetUserRoles);