import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";
import { z } from "zod";

// Schema validasi untuk assign role
const assignRoleSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa angka positif"),
  roleId: z.number().int().positive("Role ID harus berupa angka positif")
});

/**
 * Handler untuk assign role ke user
 * Memerlukan permission 'user_management' dengan action 'update'
 */
async function handleAssignRole(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user assigning role:', authenticatedUser);
    
    // Parse dan validasi request body
    const body = await request.json();
    const validatedData = assignRoleSchema.parse(body);
    
    // Assign role ke user
    const userRole = await userRoleService.assignRole(validatedData);
    
    return NextResponse.json({
      success: true,
      data: {
        userRole,
      },
      message: 'Role berhasil di-assign ke user'
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Data tidak valid",
        errors: error.issues,
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Assign role error:', error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat assign role"
    }, { status: 500 });
  }
}

// Schema validasi untuk remove role
const removeRoleSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa angka positif"),
  roleId: z.number().int().positive("Role ID harus berupa angka positif")
});

/**
 * Handler untuk remove role dari user
 * Memerlukan permission 'user_management' dengan action 'update'
 */
async function handleRemoveRole(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user removing role:', authenticatedUser);
    
    // Parse dan validasi request body
    const body = await request.json();
    const validatedData = removeRoleSchema.parse(body);
    
    // Remove role dari user
    const removed = await userRoleService.removeRole(validatedData.userId, validatedData.roleId);
    
    if (removed) {
      return NextResponse.json({
        success: true,
        message: 'Role berhasil di-remove dari user'
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Gagal remove role dari user'
      }, { status: 500 });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Data tidak valid",
        errors: error.issues,
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    
    console.error('Remove role error:', error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat remove role"
    }, { status: 500 });
  }
}

// Export handlers dengan withFeature wrapper untuk otorisasi
export const POST = withFeature({ feature: 'user_management', action: 'update' })(handleAssignRole);
export const DELETE = withFeature({ feature: 'user_management', action: 'update' })(handleRemoveRole);