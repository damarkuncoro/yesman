import { NextRequest, NextResponse } from "next/server";
import { initialSetupService } from '@/services/setup/initialSetupService';

/**
 * GET /api/setup/initial
 * Endpoint untuk mengecek apakah sistem memerlukan initial setup
 * Endpoint ini tidak memerlukan authentication karena digunakan saat belum ada user
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking if initial setup is needed...');
    
    // Cek apakah sistem memerlukan initial setup
    const needsSetup = await initialSetupService.needsInitialSetup();
    
    if (needsSetup) {
      return NextResponse.json({
        success: true,
        needsSetup: true,
        message: 'System requires initial setup. No users found in database.',
        setupUrl: '/api/setup/initial'
      });
    } else {
      return NextResponse.json({
        success: true,
        needsSetup: false,
        message: 'System already initialized. Users exist in database.'
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking initial setup status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to check setup status' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/setup/initial
 * Endpoint untuk menjalankan initial setup dan membuat super admin
 * Hanya bisa dijalankan ketika tidak ada user di database (users == 0)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting initial setup process...');
    
    // Cek dan jalankan initial setup
    const setupResult = await initialSetupService.checkAndRunInitialSetup();
    
    if (!setupResult.needsSetup) {
      return NextResponse.json(
        {
          success: false,
          message: 'Initial setup not needed. Users already exist in database.',
          userCount: setupResult.userCount
        },
        { status: 400 }
      );
    }
    
    if (setupResult.setupCompleted) {
      return NextResponse.json({
        success: true,
        message: setupResult.message,
        data: {
          userCount: setupResult.userCount,
          setupCompleted: true,
          credentials: {
            email: 'admin@company.com',
            password: 'admin123',
            warning: 'Please change this password immediately after first login'
          }
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: setupResult.message,
          userCount: setupResult.userCount
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error during initial setup:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Initial setup failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/setup/initial/reset
 * Endpoint untuk reset setup status (untuk development/testing)
 * Hanya tersedia di development mode
 */
export async function PUT(request: NextRequest) {
  try {
    // Hanya izinkan di development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        {
          success: false,
          message: 'Setup reset only available in development mode'
        },
        { status: 403 }
      );
    }
    
    console.log('🔄 Resetting setup status...');
    
    // Reset setup status
    initialSetupService.resetSetupStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Setup status reset successfully. You can run initial setup again.'
    });
    
  } catch (error) {
    console.error('❌ Error resetting setup status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to reset setup status' 
      },
      { status: 500 }
    );
  }
}