import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '@/services/rbacService';
import { authorizationMiddleware } from '@/middleware/authorizationMiddleware';

/**
 * GET /api/rbac/user-roles/[userId]
 * Mengambil roles untuk user tertentu
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Authorization check - user harus login
    const authResult = await authorizationMiddleware.authorize(request);
    console.log('damarkuncoro: Authorization result:', authResult);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { userId } = await params;
    console.log('damarkuncoro: userId result:', userId);
    
    // Validasi userId
    if (!userId || isNaN(Number(userId))) {
      console.error(`Invalid user ID: ${userId}`);
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check authorization - admin bisa akses semua, user hanya bisa akses data sendiri
    const requestedUserId = parseInt(userId);
    console.log(`Authorization check - User ID: ${authResult.userId}, Requested ID: ${requestedUserId}`);
    console.log(`User roles:`, authResult.roles);
    console.log(`Has admin role:`, authResult.hasRole('admin'));
    
    if (!authResult.hasRole('admin') && authResult.userId !== requestedUserId) {
      console.log(`Access denied for user ${authResult.userId} trying to access user ${requestedUserId}`);
      return NextResponse.json(
        { error: 'Access denied: You can only access your own roles' },
        { status: 403 }
      );
    }

    console.log(`Fetching roles for user ID: ${userId}`);
    try {
      const roles = await rbacService.getUserRoles(userId);
      console.log(`Found ${roles.length} roles for user ${userId}:`, roles);
      return NextResponse.json({ roles });
    } catch (rbacError) {
      console.error('Error in rbacService.getUserRoles:', rbacError);
      console.error('RBAC Error details:', {
        message: rbacError instanceof Error ? rbacError.message : String(rbacError),
        stack: rbacError instanceof Error ? rbacError.stack : 'No stack trace',
        userId: userId,
        timestamp: new Date().toISOString()
      });
      throw rbacError;
     }
  } catch (error) {
    console.error('Error fetching user roles:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}