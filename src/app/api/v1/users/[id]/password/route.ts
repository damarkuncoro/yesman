import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenAndGetUserContext } from '@/lib/authUtils'
import { userService } from '@/services'
import { passwordService } from '@/lib/auth/authService/passwordService'

/**
 * PUT /api/v1/users/[id]/password
 * Update password untuk user tertentu
 * Mengikuti prinsip SRP - hanya bertanggung jawab untuk update password
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params untuk Next.js 15
    const { id } = await params
    // Validasi autentikasi - extract token dari header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Token tidak ditemukan'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const currentUser = await verifyTokenAndGetUserContext(token)
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'User tidak terautentikasi'
      }, { status: 401 })
    }

    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        message: 'User ID tidak valid'
      }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { password } = body

    // Validasi input
    if (!password) {
      return NextResponse.json({
        success: false,
        message: 'Password wajib diisi'
      }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password minimal 6 karakter'
      }, { status: 400 })
    }

    // Cek apakah user yang akan diupdate ada
    const targetUser = await userService.getUserById(userId)
    if (!targetUser) {
      return NextResponse.json({
        success: false,
        message: 'User tidak ditemukan'
      }, { status: 404 })
    }

    // Validasi authorization - user hanya bisa update password sendiri atau role.grants_all 
    const isAdmin = currentUser.roles?.some((role: string) => 
      role === 'admin' || role === 'super_admin' 
    ) || currentUser.hasGrantsAll
    
    if (currentUser.user.id !== userId && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Tidak memiliki izin untuk mengubah password user ini'
      }, { status: 403 })
    }

    // Hash password baru
    console.log('🔐 Hashing password for user:', userId)
    const hashedPassword = await passwordService.hashPassword(password)
    console.log('✅ Password hashed successfully, length:', hashedPassword.length)

    // Update password di database menggunakan field passwordHash
    console.log('💾 Updating password in database for user:', userId)
    const updateResult = await userService.updateUserPassword(userId, hashedPassword);
    console.log('📊 Update result:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diupdate'
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error updating password:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({
      success: false,
      message: 'Gagal mengupdate password'
    }, { status: 500 })
  }
}