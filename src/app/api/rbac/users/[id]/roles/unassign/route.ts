import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services/rbacService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";
import { z } from "zod";

/**
 * Schema validasi untuk unassign role
 */
const unassignRoleSchema = z.object({
  roleId: z.number().int().positive("Role ID harus berupa integer positif")
});

/**
 * DELETE /api/rbac/users/[id]/roles/unassign
 * Unassign role dari user tertentu
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check - basic authentication
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    // Untuk sementara, izinkan semua user yang sudah terautentikasi
    // Nanti bisa ditambahkan logika authorization yang lebih spesifik jika diperlukan

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'ID user tidak valid' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = unassignRoleSchema.parse(body);
    
    const success = await userRoleService.removeRole(userId, validatedData.roleId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Role berhasil di-unassign dari user'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal unassign role dari user' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error unassigning role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Data tidak valid',
          errors: error.issues
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat unassign role' 
      },
      { status: 400 }
    );
  }
}