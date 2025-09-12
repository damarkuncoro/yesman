import { NextRequest, NextResponse } from "next/server";
import { userRoleService } from "@/services/rbacService";
import { authorizationMiddleware } from "@/middleware/authorizationMiddleware";

/**
 * GET /api/rbac/users/[id]/roles
 * Mengambil semua role untuk user tertentu
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Basic authorization check
    const authResult = await authorizationMiddleware.authorize(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'ID user tidak valid' },
        { status: 400 }
      );
    }

    // Untuk sementara, izinkan semua user yang sudah terautentikasi mengakses endpoint ini
    // Nanti bisa ditambahkan logika authorization yang lebih spesifik jika diperlukan
    // User yang sudah login bisa melihat role user lain untuk keperluan management

    const userRoles = await userRoleService.getUserRoles(userId);
    
    return NextResponse.json({
      success: true,
      data: userRoles
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data role user' 
      },
      { status: error instanceof Error && error.message.includes('tidak ditemukan') ? 404 : 500 }
    );
  }
}