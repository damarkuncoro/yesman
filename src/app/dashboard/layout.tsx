import { AuthGuard } from '@/components/auth/AuthGuard';

/**
 * Props untuk DashboardLayout
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout khusus untuk halaman dashboard
 * 
 * Layout ini akan:
 * - Melindungi semua halaman dashboard dengan AuthGuard
 * - Redirect ke login jika user belum authenticated
 * - Menyediakan loading state saat checking authentication
 * 
 * Semua halaman di dalam /dashboard/* akan otomatis terlindungi
 * oleh authentication guard ini.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard 
      redirectTo="/login"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memverifikasi akses dashboard...</p>
            <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      }
    >
      {children}
    </AuthGuard>
  );
}

/**
 * Metadata untuk dashboard layout
 */
export const metadata = {
  title: 'Dashboard - YesMan',
  description: 'Dashboard untuk manajemen sistem YesMan',
};