/**
 * Utility functions untuk menangani redirect authentication
 * Mengikuti prinsip DRY dan SRP untuk centralized redirect logic
 */

/**
 * Interface untuk konfigurasi redirect
 */
export interface AuthRedirectConfig {
  loginUrl?: string;
  preserveCurrentPath?: boolean;
  clearTokens?: boolean;
}

/**
 * Default konfigurasi untuk redirect
 */
const DEFAULT_CONFIG: Required<AuthRedirectConfig> = {
  loginUrl: '/login',
  preserveCurrentPath: true,
  clearTokens: true
};

/**
 * Utility function untuk clear authentication tokens
 * @param includeRefreshToken - Apakah refresh token juga dihapus
 */
export function clearAuthTokens(includeRefreshToken: boolean = true): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accessToken');
  if (includeRefreshToken) {
    localStorage.removeItem('refreshToken');
  }
  
  // Clear any auth-related session storage
  sessionStorage.removeItem('userSession');
  sessionStorage.removeItem('authState');
}

/**
 * Utility function untuk menyimpan current path untuk redirect setelah login
 * @param currentPath - Path yang akan disimpan
 */
export function saveRedirectPath(currentPath?: string): void {
  if (typeof window === 'undefined') return;
  
  const pathToSave = currentPath || window.location.pathname;
  
  // Jangan simpan jika sudah di halaman auth
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (!authPages.includes(pathToSave)) {
    localStorage.setItem('redirectAfterLogin', pathToSave);
  }
}

/**
 * Utility function untuk mendapatkan saved redirect path
 * @returns Saved path atau null jika tidak ada
 */
export function getSavedRedirectPath(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('redirectAfterLogin');
}

/**
 * Utility function untuk clear saved redirect path
 */
export function clearSavedRedirectPath(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('redirectAfterLogin');
}

/**
 * Utility function untuk membuat login URL dengan redirect parameter
 * @param config - Konfigurasi redirect
 * @returns URL login dengan parameter redirect
 */
export function createLoginUrlWithRedirect(config: AuthRedirectConfig = {}): string {
  if (typeof window === 'undefined') return DEFAULT_CONFIG.loginUrl;
  
  const { loginUrl, preserveCurrentPath } = { ...DEFAULT_CONFIG, ...config };
  const currentPath = window.location.pathname;
  
  const loginUrlObj = new URL(loginUrl, window.location.origin);
  
  if (preserveCurrentPath && currentPath !== loginUrl) {
    loginUrlObj.searchParams.set('redirect', currentPath);
  }
  
  return loginUrlObj.toString();
}

/**
 * Main function untuk handle 401 unauthorized redirect
 * Menggabungkan semua utility functions untuk handling yang lengkap
 * @param config - Konfigurasi redirect
 */
export function handleUnauthorizedRedirect(config: AuthRedirectConfig = {}): void {
  if (typeof window === 'undefined') return;
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Clear tokens jika diminta
  if (finalConfig.clearTokens) {
    clearAuthTokens();
  }
  
  // Simpan current path jika diminta
  if (finalConfig.preserveCurrentPath) {
    saveRedirectPath();
  }
  
  // Redirect ke login page
  const loginUrl = createLoginUrlWithRedirect(finalConfig);
  window.location.href = loginUrl;
}

/**
 * Utility function untuk redirect setelah login berhasil
 * @param defaultUrl - URL default jika tidak ada saved redirect
 * @returns URL tujuan redirect
 */
export function getPostLoginRedirectUrl(defaultUrl: string = '/dashboard'): string {
  // Cek URL parameter terlebih dahulu
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    if (redirectParam && isValidRedirectUrl(redirectParam)) {
      clearSavedRedirectPath();
      return redirectParam;
    }
  }
  
  // Cek saved redirect path
  const savedPath = getSavedRedirectPath();
  if (savedPath && isValidRedirectUrl(savedPath)) {
    clearSavedRedirectPath();
    return savedPath;
  }
  
  return defaultUrl;
}

/**
 * Utility function untuk validasi redirect URL
 * Mencegah open redirect vulnerability
 * @param url - URL yang akan divalidasi
 * @returns Boolean apakah URL valid
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    // Hanya allow relative URLs atau URLs dengan same origin
    if (url.startsWith('/')) {
      return true;
    }
    
    if (typeof window !== 'undefined') {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin === window.location.origin;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Hook-like function untuk auto redirect pada component mount
 * @param shouldRedirect - Kondisi apakah harus redirect
 * @param config - Konfigurasi redirect
 */
export function useUnauthorizedRedirect(shouldRedirect: boolean, config: AuthRedirectConfig = {}): void {
  if (shouldRedirect) {
    handleUnauthorizedRedirect(config);
  }
}

/**
 * Export semua utilities sebagai object untuk kemudahan import
 */
export const AuthRedirectUtils = {
  clearAuthTokens,
  saveRedirectPath,
  getSavedRedirectPath,
  clearSavedRedirectPath,
  createLoginUrlWithRedirect,
  handleUnauthorizedRedirect,
  getPostLoginRedirectUrl,
  isValidRedirectUrl,
  useUnauthorizedRedirect
} as const;