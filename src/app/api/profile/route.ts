import { NextRequest, NextResponse } from 'next/server';
import { withFeature, getUserFromRequest } from '@/lib/withFeature';
import { userService } from '@/services';
import { createErrorResponse } from '@/lib/authUtils';

/**
 * Handler untuk mengambil profil user yang sedang login
 * Memerlukan permission 'profile:read'
 */
async function handleGetProfile(req: NextRequest): Promise<NextResponse> {
  try {
    // Ambil user yang sedang login dari request
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'User tidak terautentikasi'
      }, { status: 401 });
    }
    console.log(`User ${currentUser.email} mengakses profil`);
    
    // Ambil detail profil dari service
    const userProfile = await userService.getUserById(currentUser.id);
    
    if (!userProfile) {
      return NextResponse.json({
        success: false,
        message: 'Profil tidak ditemukan'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        active: userProfile.active,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt
      },
      message: 'Berhasil mengambil profil'
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil profil'
    }, { status: 500 });
  }
}

/**
 * Handler untuk update profil user yang sedang login
 * Memerlukan permission 'profile:update'
 */
async function handleUpdateProfile(req: NextRequest): Promise<NextResponse> {
  try {
    // Ambil user yang sedang login
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'User tidak terautentikasi'
      }, { status: 401 });
    }
    console.log(`User ${currentUser.email} mengupdate profil`);
    
    // Parse request body
    const body = await req.json();
    const { name, email } = body;
    
    // Validasi input
    if (!name && !email) {
      return NextResponse.json({
        success: false,
        message: 'Minimal satu field harus diisi'
      }, { status: 400 });
    }
    
    // Update profil melalui service
    const updatedUser = await userService.updateUserProfile(currentUser.id, {
      ...(name && { name }),
      ...(email && { email })
    });
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Gagal mengupdate profil'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        active: updatedUser.active,
        updatedAt: updatedUser.updatedAt
      },
      message: 'Profil berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error instanceof Error && error.message.includes('Email sudah terdaftar')) {
      return NextResponse.json({
        success: false,
        message: 'Email sudah digunakan oleh user lain'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Gagal mengupdate profil'
    }, { status: 500 });
  }
}

/**
 * Handler untuk mengubah password user yang sedang login
 * Memerlukan permission 'profile:update'
 */
async function handleChangePassword(req: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'User tidak terautentikasi'
      }, { status: 401 });
    }
    console.log(`User ${currentUser.email} mengubah password`);
    
    const body = await req.json();
    const { currentPassword, newPassword } = body;
    
    // Validasi input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        message: 'Password lama dan baru wajib diisi'
      }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      }, { status: 400 });
    }
    
    // Note: Method changePassword belum tersedia di UserService
    // Untuk sementara return error
    return NextResponse.json({
      success: false,
      message: 'Fitur ubah password belum tersedia'
    }, { status: 501 });
    
    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    
    if (error instanceof Error && error.message.includes('Password lama tidak sesuai')) {
      return NextResponse.json({
        success: false,
        message: 'Password lama tidak sesuai'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Gagal mengubah password'
    }, { status: 500 });
  }
}

// Export handlers dengan authorization wrapper
// Setiap endpoint akan otomatis dicek permission-nya berdasarkan feature dan action
export const GET = withFeature({ feature: 'profile', action: 'read' })(handleGetProfile);
export const PUT = withFeature({ feature: 'profile', action: 'update' })(handleUpdateProfile);
export const PATCH = withFeature({ feature: 'profile', action: 'update' })(handleChangePassword);