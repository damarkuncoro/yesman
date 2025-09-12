import { User } from "@/db/schema";

/**
 * Type untuk user yang sudah dihilangkan passwordHash
 */
export type AuthUser = Omit<User, 'passwordHash'>;

/**
 * Interface untuk response API authentication
 */
export interface AuthApiResponse {
  success: boolean;
  message?: string;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken?: string;
  };
}

/**
 * Interface untuk response update profile
 */
export interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  data: {
    user: AuthUser;
  };
}

/**
 * Interface untuk state authentication
 */
export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Type untuk actions yang dapat dilakukan pada auth state
 */
export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; accessToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: AuthUser };

/**
 * Interface untuk context type yang akan diexpose
 */
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  refreshToken: () => Promise<void>;
}

/**
 * Initial state untuk auth reducer
 */
export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
};