import { AuthState, AuthAction } from './types';

/**
 * Reducer untuk mengelola state authentication
 * Mengikuti pattern Redux untuk state management yang predictable
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'LOGIN_SUCCESS':
      // Simpan ke localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isLoading: false,
        isAuthenticated: true,
      };
    
    case 'LOGOUT':
      // Hapus dari localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
      return {
        ...state,
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      };
    
    case 'UPDATE_USER':
      // Update user data di localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload));
      }
      return {
        ...state,
        user: action.payload,
      };
    
    default:
      return state;
  }
}