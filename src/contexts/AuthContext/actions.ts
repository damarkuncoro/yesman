import { AuthAction, AuthUser } from './types';

/**
 * Action creators untuk auth state management
 * Mengikuti pattern Redux untuk konsistensi dan type safety
 */

/**
 * Action untuk mengatur loading state
 */
export const setLoadingAction = (isLoading: boolean): AuthAction => ({
  type: 'SET_LOADING',
  payload: isLoading,
});

/**
 * Action untuk login berhasil
 */
export const loginSuccessAction = (user: AuthUser, accessToken: string): AuthAction => ({
  type: 'LOGIN_SUCCESS',
  payload: { user, accessToken },
});

/**
 * Action untuk logout
 */
export const logoutAction = (): AuthAction => ({
  type: 'LOGOUT',
});

/**
 * Action untuk update user data
 */
export const updateUserAction = (user: AuthUser): AuthAction => ({
  type: 'UPDATE_USER',
  payload: user,
});