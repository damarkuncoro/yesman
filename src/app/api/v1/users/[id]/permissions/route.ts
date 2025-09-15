import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '@/services';
import { withFeature, getUserFromRequest } from '@/lib/withFeature';

/**
 * Handler untuk mengambil permissions untuk user tertentu
 * Memerlukan permission 'user_management' dengan action 'read'
 */
async function handleGetUserPermissions(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing user permissions:', authenticatedUser);

    // Extract user ID dari URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.findIndex(segment => segment === 'users') + 1];
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const permissions = await rbacService.getUserPermissions(userId);
    
    return NextResponse.json({
      success: true,
      data: { permissions }
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Get user permissions error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user permissions'
    }, { status: 500 });
  }
}

// Export handler dengan withFeature wrapper untuk otorisasi
export const GET = withFeature({ feature: 'user_management', action: 'read' })(handleGetUserPermissions);