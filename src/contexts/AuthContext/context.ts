"use client";

import { createContext } from "react";
import { AuthContextType } from './types';

/**
 * React Context untuk authentication
 * Menyediakan state dan methods authentication ke seluruh aplikasi
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);