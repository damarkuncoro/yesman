import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/userService";
import { withFeature, getUserFromRequest } from "@/lib/withFeature";

/**
 * Handler untuk mendapatkan daftar semua user aktif
 * Memerlukan permission 'user_management' dengan action 'read'
 */
async function handleGetUsers(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = getUserFromRequest(request);
    console.log('Authenticated user accessing users list:', authenticatedUser);
    
    // Ambil semua user aktif
    const users = await userService.getActiveUsers();
    
    return NextResponse.json({
      success: true,
      data: {
        users,
      },
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 401 });
    }
    
    console.error("Get users error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan server",
    }, { status: 500 });
  }
}

// Export handler dengan authorization wrapper
// User harus memiliki permission 'user_management' dengan action 'read' untuk mengakses daftar user
export const GET = withFeature({ feature: 'user_management', action: 'read' })(handleGetUsers);