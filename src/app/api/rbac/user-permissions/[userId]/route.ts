import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '@/services';
import { authorizationMiddleware } from '@/middleware/authorizationMiddleware';

/**
 * GET /api/rbac/user-permissions/[userId]
 * Mengambil permissions untuk user tertentu
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Authorization check - user harus login
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check authorization - admin bisa akses semua, user hanya bisa akses data sendiri
    const requestedUserId = parseInt(userId);
    if (!authResult.hasRole('admin') && authResult.userId !== requestedUserId) {
      return NextResponse.json(
        { error: 'Access denied: You can only access your own permissions' },
        { status: 403 }
      );
    }

    const permissions = await rbacService.getUserPermissions(userId);
    
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user permissions' },
      { status: 500 }
    );
  }
}