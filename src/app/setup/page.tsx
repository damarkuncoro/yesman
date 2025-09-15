'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Halaman Initial Setup Wizard
 * Hanya muncul ketika tidak ada user di database (users == 0)
 * Mengikuti prinsip User Experience dan Security First
 */
export default function InitialSetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    warning: string;
  } | null>(null);
  
  const router = useRouter();

  /**
   * Mengecek apakah sistem memerlukan initial setup
   */
  useEffect(() => {
    checkSetupStatus();
  }, []);

  /**
   * Fungsi untuk mengecek status setup
   */
  const checkSetupStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/setup/initial', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNeedsSetup(data.needsSetup);
        
        // Jika tidak perlu setup, redirect ke login
        if (!data.needsSetup) {
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        setError(data.message || 'Failed to check setup status');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Setup check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fungsi untuk menjalankan initial setup
   */
  const runInitialSetup = async () => {
    try {
      setIsSettingUp(true);
      setError(null);
      
      const response = await fetch('/api/setup/initial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data?.setupCompleted) {
        setSetupComplete(true);
        setCredentials(data.data.credentials);
      } else {
        setError(data.message || 'Setup failed');
      }
    } catch (err) {
      setError('Network error during setup. Please try again.');
      console.error('Setup error:', err);
    } finally {
      setIsSettingUp(false);
    }
  };

  /**
   * Fungsi untuk redirect ke login
   */
  const goToLogin = () => {
    router.push('/login');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Checking System Status</h2>
            <p className="text-gray-600">Please wait while we check if initial setup is required...</p>
          </div>
        </div>
      </div>
    );
  }

  // Setup complete state
  if (setupComplete && credentials) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Setup Complete!</h1>
            <p className="text-gray-600 mb-6">Your YesMan application has been successfully initialized.</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">Super Admin Credentials</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">{credentials.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Password:</span>
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">{credentials.password}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-semibold text-amber-800 mb-1">Security Notice</h4>
                <p className="text-amber-700 text-sm">{credentials.warning}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={goToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  // No setup needed state
  if (!needsSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">System Already Initialized</h1>
            <p className="text-gray-600 mb-6">Your YesMan application is already set up and ready to use.</p>
            <p className="text-sm text-gray-500 mb-6">Redirecting to login page...</p>
            <button
              onClick={goToLogin}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup wizard state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to YesMan</h1>
          <p className="text-gray-600">Let's set up your application with an initial super administrator account.</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">What will be created:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Super Administrator account</li>
            <li>• Email: admin@company.com</li>
            <li>• Temporary password: admin123</li>
            <li>• Full system access and permissions</li>
          </ul>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">Important</h4>
              <p className="text-amber-700 text-sm">Please change the default password immediately after your first login for security purposes.</p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Setup Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={runInitialSetup}
            disabled={isSettingUp}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSettingUp ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Setting up...
              </>
            ) : (
              'Start Initial Setup'
            )}
          </button>
          
          <button
            onClick={checkSetupStatus}
            disabled={isSettingUp}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}