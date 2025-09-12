// Re-export dari HTTP client yang baru
// Mengikuti prinsip DRY dengan menghindari duplikasi kode
export type { ApiResponse, RequestOptions } from "./types";
export { httpClient as apiRequest, httpClient, publicHttpClient } from "./http/httpClient";

// Import untuk backward compatibility
import { httpClient, publicHttpClient } from "./http/httpClient";

// Backward compatibility function
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// Re-export HTTP client instances dengan backward compatibility
export const api = httpClient;
export const publicApi = publicHttpClient;

// Export getStoredToken untuk backward compatibility
export { getStoredToken };