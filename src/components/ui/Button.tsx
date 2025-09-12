"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Variant untuk button styling
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

/**
 * Ukuran untuk button
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props untuk Button component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Modern Button component dengan berbagai variant dan ukuran
 * Mengikuti design system yang konsisten
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  
  /**
   * Base styles untuk semua button
   */
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  /**
   * Variant styles
   */
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 bg-white",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md"
  };
  
  /**
   * Size styles
   */
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };
  
  /**
   * Loading spinner component
   */
  const LoadingSpinner = () => (
    <svg 
      className={cn(
        "animate-spin",
        size === 'sm' ? "h-3 w-3" : size === 'md' ? "h-4 w-4" : "h-5 w-5"
      )} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

/**
 * Button dengan icon saja (square button)
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  children,
  className,
  ...props
}: Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'fullWidth'>) {
  const sizeStyles = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3"
  };
  
  return (
    <Button
      variant={variant}
      className={cn(
        "!px-0 !py-0 aspect-square",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}