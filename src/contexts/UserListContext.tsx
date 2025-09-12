"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import { User } from "@/db/schema";
import { useAuth } from "./AuthContext";

/**
 * Interface untuk user tanpa password hash
 */
type UserListItem = Omit<User, 'passwordHash'>;

/**
 * Interface untuk user list state
 */
interface UserListState {
  users: UserListItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Actions untuk user list reducer
 */
type UserListAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USERS'; payload: UserListItem[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_USER'; payload: UserListItem }
  | { type: 'UPDATE_USER'; payload: UserListItem }
  | { type: 'REMOVE_USER'; payload: number };

/**
 * Interface untuk user list context
 */
interface UserListContextType extends UserListState {
  fetchUsers: () => Promise<void>;
  addUser: (user: UserListItem) => void;
  updateUser: (user: UserListItem) => void;
  removeUser: (userId: number) => void;
  refreshUsers: () => Promise<void>;
}

/**
 * Initial state untuk user list
 */
const initialState: UserListState = {
  users: [],
  isLoading: false,
  error: null,
};

/**
 * Reducer untuk mengelola user list state
 */
function userListReducer(state: UserListState, action: UserListAction): UserListState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error, // Clear error saat loading
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
      };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case 'REMOVE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    default:
      return state;
  }
}

/**
 * Create user list context
 */
const UserListContext = createContext<UserListContextType | undefined>(undefined);

/**
 * Props untuk UserListProvider
 */
interface UserListProviderProps {
  children: ReactNode;
}

/**
 * User List Provider Component
 * Mengelola state user list dan menyediakan methods untuk user list operations
 */
export function UserListProvider({ children }: UserListProviderProps) {
  const [state, dispatch] = useReducer(userListReducer, initialState);
  const { accessToken, isAuthenticated } = useAuth();

  /**
   * Function untuk fetch users dari API
   */
  const fetchUsers = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !accessToken) {
      dispatch({ type: 'SET_ERROR', payload: 'Tidak ada akses token' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil data users');
      }
      
      dispatch({ type: 'SET_USERS', payload: data.data.users });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [accessToken, isAuthenticated]);

  /**
   * Function untuk menambah user ke state (untuk optimistic update)
   */
  const addUser = useCallback((user: UserListItem): void => {
    dispatch({ type: 'ADD_USER', payload: user });
  }, []);

  /**
   * Function untuk update user di state (untuk optimistic update)
   */
  const updateUser = useCallback((user: UserListItem): void => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  /**
   * Function untuk remove user dari state (untuk optimistic update)
   */
  const removeUser = useCallback((userId: number): void => {
    dispatch({ type: 'REMOVE_USER', payload: userId });
  }, []);

  /**
   * Function untuk refresh users (alias untuk fetchUsers)
   */
  const refreshUsers = useCallback(async (): Promise<void> => {
    await fetchUsers();
  }, [fetchUsers]);

  /**
   * Context value yang akan di-provide
   */
  const contextValue: UserListContextType = {
    ...state,
    fetchUsers,
    addUser,
    updateUser,
    removeUser,
    refreshUsers,
  };

  return (
    <UserListContext.Provider value={contextValue}>
      {children}
    </UserListContext.Provider>
  );
}

/**
 * Custom hook untuk menggunakan user list context
 * @returns UserListContextType - User list context value
 */
export function useUserList(): UserListContextType {
  const context = useContext(UserListContext);
  
  if (context === undefined) {
    throw new Error('useUserList must be used within a UserListProvider');
  }
  
  return context;
}