import { NextRequest, NextResponse } from 'next/server'
import { roleService } from '@/services/rbac/roleService'
import { authorizationMiddleware } from '@/middleware/authorizationMiddleware'

/**
 * GET /api/roles/[id] - Mengambil detail role berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    })
    
    if (authResult instanceof NextResponse) {
      return authResult // Return error response
    }

    const { id } = await params;
    const roleId = parseInt(id)
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    // Ambil detail role dari service
    const role = await roleService.getRoleById(roleId)

    return NextResponse.json({
      success: true,
      data: {
        role
      }
    })
  } catch (error: any) {
    console.error('Error fetching role details:', error)
    
    // Handle specific error types
    if (error.message?.includes('tidak ditemukan') || error.name === 'RoleNotFoundError') {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/roles/[id] - Update role berdasarkan ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    })
    
    if (authResult instanceof NextResponse) {
      return authResult // Return error response
    }

    const { id } = await params;
    const roleId = parseInt(id)
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, grants_all } = body

    // Validasi input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      )
    }

    // Update role
    const updatedRole = await roleService.updateRole(roleId, {
      name,
      grantsAll: Boolean(grants_all)
    })

    return NextResponse.json({
      success: true,
      data: {
        role: updatedRole
      }
    })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/roles/[id] - Hapus role berdasarkan ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check
    const authResult = await authorizationMiddleware.authorize(request, {
      requiredRoles: ['admin']
    })
    
    if (authResult instanceof NextResponse) {
      return authResult // Return error response
    }

    const { id } = await params;
    const roleId = parseInt(id)
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    // Hapus role
    await roleService.deleteRole(roleId)

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}