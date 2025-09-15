import { NextRequest, NextResponse } from 'next/server';
import { createRouteAuthorizationMiddleware } from './middleware/exports';
import { createCorsHandler } from './middleware/cors/corsHandler';


/**
 * Fungsi helper untuk mendeteksi apakah request berasal dari browser
 * @param request - NextRequest object
 * @returns boolean - true jika browser request
 */
function isBrowserRequest(request: NextRequest): boolean {
  const acceptHeader = request.headers.get('accept') || '';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Deteksi browser berdasarkan Accept header yang mengandung text/html
  const isBrowser = acceptHeader.includes('text/html');
  
  // Deteksi API request berdasarkan Content-Type atau Accept header
  const isApiRequest = acceptHeader.includes('application/json') || 
                      request.headers.get('content-type')?.includes('application/json');
  
  return isBrowser && !isApiRequest;
}

/**
 * Main middleware function untuk route-level authorization
 * Menggunakan refactored middleware dengan prinsip SOLID dan DRY
 * @param request - NextRequest object
 * @returns Promise<NextResponse> - Response atau redirect
 */
export default async function middleware(request: NextRequest) {
  console.log('   - middleware.ts loaded');
  try {
    // Inisialisasi CORS handler
    const corsHandler = createCorsHandler();
    
    // Handle preflight CORS requests
    if (corsHandler.isPreflightRequest(request)) {
      return corsHandler.handlePreflightRequest(request);
    }

    // Gunakan refactored middleware orchestrator
    const middlewareOrchestrator = createRouteAuthorizationMiddleware();
    const result = await middlewareOrchestrator.handleRouteAuthorization(
      request,
      'read' // Default action, akan di-override berdasarkan HTTP method
    );
    
    // Handle result dari middleware
    if (result instanceof NextResponse) {
      // Jika response adalah error 401 dan request dari browser, redirect ke login
      if (result.status === 401 && isBrowserRequest(request)) {
        const loginUrl = new URL('/login', request.url);
        // Tambahkan redirect parameter untuk kembali ke halaman asal setelah login
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        console.log('🔒 Browser request unauthorized, redirecting to login:', loginUrl.toString());
        return NextResponse.redirect(loginUrl);
      }
      return result;
    }
    
    // Jika berhasil, create response dengan headers
    const response = NextResponse.next();
    if (result.userId && result.userId > 0) {
      response.headers.set('x-auth-user-id', result.userId.toString());
      response.headers.set('x-auth-user-email', result.email);
      response.headers.set('x-auth-user-roles', JSON.stringify(result.roles));
    }
    
    // Tambahkan CORS headers ke response
    return corsHandler.handleCorsRequest(request, response);
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Untuk browser requests, redirect ke login jika terjadi error auth
    if (isBrowserRequest(request)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Matcher configuration untuk menentukan routes mana yang akan diproses middleware
export const config = {
  runtime: 'nodejs',
  matcher: [
    /*
     * Match semua request paths kecuali:
     * 1. /api/auth/* (auth endpoints)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     * 5. Files dengan extension (images, etc)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};