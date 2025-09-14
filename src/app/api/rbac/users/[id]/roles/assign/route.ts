import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";
import { z } from "zod";

/**
 * Schema validasi untuk assign role
 */
const assignRoleSchema = z.object({
  roleId: z.number().int().positive("Role ID harus berupa integer positif")
});

/**
 * POST /api/rbac/users/[id]/roles/assign
 * Assign role ke user tertentu
 */
export async function POST(
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
    const validatedData = assignRoleSchema.parse(body);
    
    const userRole = await userRoleService.assignRole({
      userId,
      roleId: validatedData.roleId
    });
    
    return NextResponse.json({
      success: true,
      data: userRole,
      message: 'Role berhasil di-assign ke user'
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning role:', error);
    
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
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat assign role' 
      },
      { status: 400 }
    );
  }
}