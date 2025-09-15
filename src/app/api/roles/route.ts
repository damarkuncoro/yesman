import { NextRequest, NextResponse } from "next/server";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { roleService } from "@/services";
import { createRoleSchema } from "@/services/rbac/types";
import { z } from "zod";

/**
 * Handler untuk mendapatkan daftar semua role
 * Memerlukan permission 'role_management' dengan action 'read'
 */
async function handleGetRoles(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing roles list:', authenticatedUser);
    
    // Ambil semua role dari service
    const roles = await roleService.getAllRoles();
    
    return NextResponse.json({
      success: true,
      data: {
        roles,
      },
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get roles error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

/**
 * Handler untuk membuat role baru
 * Memerlukan permission 'role_management' dengan action 'create'
 */
async function handleCreateRole(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user creating new role:', authenticatedUser);
    
    // Parse request body
    const body = await request.json();
    console.log('Create role request body:', body);
    
    // Validasi input dengan Zod
    const validatedData = createRoleSchema.parse(body);
    console.log('Validation successful:', validatedData);
    
    // Buat role melalui service layer
    const newRole = await roleService.createRole(validatedData);
    
    return NextResponse.json({
      success: true,
      data: {
        role: newRole,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Zod validation error:', error.issues);
      return NextResponse.json(
        { 
          success: false, 
          message: "Data tidak valid", 
          errors: error.issues 
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Terjadi kesalahan saat membuat role" 
      },
      { status: 500 }
    );
  }
}

// Export handlers dengan authorization wrapper
// User harus memiliki permission 'role_management' dengan action 'read' untuk GET
export const GET = withFeature({ feature: 'role_management', action: 'read' })(handleGetRoles);

// User harus memiliki permission 'role_management' dengan action 'create' untuk POST
export const POST = withFeature({ feature: 'role_management', action: 'create' })(handleCreateRole);