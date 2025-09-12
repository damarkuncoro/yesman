"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserListProvider } from "@/contexts/UserListContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoginForm } from "@/components/ui/LoginForm";
import { RegisterForm } from "@/components/ui/RegisterForm";
import { UserProfile } from "@/components/ui/UserProfile";
import { UserList } from "@/components/ui/UserList";
import { UserDetail } from "@/components/ui/UserDetail";
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardHeader, CardContent, StatsCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Tipe untuk halaman yang aktif
 */
type ActivePage = 'profile' | 'users' | 'userDetail';

/**
 * Tipe untuk mode autentikasi
 */
type AuthMode = 'login' | 'register';

/**
 * Component untuk menampilkan form autentikasi
 */
function AuthSection() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { isLoading } = useAuth();

  /**
   * Handler untuk switch antara login dan register
   */
  const handleAuthModeSwitch = (mode: AuthMode) => {
    setAuthMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">YesMan</h1>
          <h2 className="text-xl text-gray-600">
            {authMode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {authMode === 'login' ? (
            <LoginForm 
              onSwitchToRegister={() => handleAuthModeSwitch('register')}
            />
          ) : (
            <RegisterForm 
              onSwitchToLogin={() => handleAuthModeSwitch('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Component untuk dashboard utama setelah login
 */
function Dashboard() {
  const [activePage, setActivePage] = useState<ActivePage>('profile');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { user } = useAuth();

  /**
   * Handler untuk navigasi antar halaman
   */
  const handleNavigation = (page: ActivePage) => {
    setActivePage(page);
    if (page !== 'userDetail') {
      setSelectedUserId(null);
    }
  };

  /**
   * Handler untuk navigasi ke detail user
   */
  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setActivePage('userDetail');
  };

  /**
   * Handler untuk kembali dari detail user
   */
  const handleBackFromUserDetail = () => {
    setSelectedUserId(null);
    setActivePage('users');
  };

  /**
   * Handler untuk refresh data setelah profile update
   */
  const handleProfileUpdate = () => {
    // Bisa ditambahkan logic refresh jika diperlukan
    console.log('Profile updated successfully');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card variant="elevated" padding="xl" className="text-center backdrop-blur-sm bg-white/95">
          <CardContent className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 font-medium">Memuat dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation Bar */}
      <Navbar 
        onNavigate={handleNavigation}
        currentPage={activePage}
      />

      {/* Dashboard Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Selamat datang, {user.name}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {activePage === 'profile' 
                  ? 'Kelola profil dan pengaturan akun Anda' 
                  : activePage === 'userDetail' 
                    ? 'Detail informasi pengguna'
                    : 'Kelola daftar pengguna sistem'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle size="sm" />
              <Badge 
                variant="success" 
                size="md"
                className="font-medium"
              >
                Online
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
             title="Status Akun"
             value="Aktif"
             icon={
               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             }
             className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
           />
          
          <StatsCard
            title="Halaman Aktif"
            value={activePage === 'profile' ? 'Profil' : activePage === 'userDetail' ? 'Detail User' : 'Daftar User'}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            }
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
          />
          
          <StatsCard
             title="Sesi Login"
             value="Aman"
             icon={
               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
             }
             className="bg-gradient-to-r from-purple-500 to-pink-600 text-white"
           />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card variant="elevated" padding="none" className="backdrop-blur-sm bg-white/95 overflow-hidden">
          {activePage === 'profile' ? (
            <UserProfile 
              onProfileUpdate={handleProfileUpdate}
              className=""
            />
          ) : activePage === 'userDetail' && selectedUserId ? (
            <UserDetail 
              userId={selectedUserId}
              onBack={handleBackFromUserDetail}
              className="p-6"
            />
          ) : (
            <UserListProvider>
              <UserList 
                onUserSelect={handleUserSelect}
                className="" 
              />
            </UserListProvider>
          )}
        </Card>
      </main>
    </div>
  );
}

/**
 * Component utama aplikasi dengan context providers
 */
function AppContent() {
  const { user, isLoading } = useAuth();

  /**
   * Check auth status saat component mount
   */
  useEffect(() => {
    // Auth status akan di-check otomatis oleh AuthProvider
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // Render berdasarkan status autentikasi
  return user ? <Dashboard /> : <AuthSection />;
}

/**
 * Main App component dengan semua providers
 */
export function MainApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}