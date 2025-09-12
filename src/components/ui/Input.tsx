"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Variant untuk input styling
 */
type InputVariant = 'default' | 'error' | 'success';

/**
 * Ukuran untuk input
 */
type InputSize = 'sm' | 'md' | 'lg';

/**
 * Props untuk Input component
 */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Modern Input component dengan label, error handling, dan icons
 * Menggunakan forwardRef untuk ref forwarding
 */
export const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    variant = 'default',
    size = 'md',
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    id,
    ...props
  },
  ref
) => {
  // Generate unique ID jika tidak disediakan
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Tentukan variant berdasarkan error/success state
  const currentVariant = error ? 'error' : success ? 'success' : variant;
  
  /**
   * Base styles untuk input
   */
  const baseStyles = "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  /**
   * Variant styles
   */
  const variantStyles = {
    default: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
    error: "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50",
    success: "border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50"
  };
  
  /**
   * Size styles
   */
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-4 py-3 text-base"
  };
  
  /**
   * Padding adjustment untuk icons
   */
  const iconPadding = {
    sm: { left: leftIcon ? "pl-9" : "", right: rightIcon ? "pr-9" : "" },
    md: { left: leftIcon ? "pl-10" : "", right: rightIcon ? "pr-10" : "" },
    lg: { left: leftIcon ? "pl-12" : "", right: rightIcon ? "pr-12" : "" }
  };
  
  /**
   * Icon positioning
   */
  const iconPositioning = {
    sm: { left: "left-3 top-1.5", right: "right-3 top-1.5", size: "h-4 w-4" },
    md: { left: "left-3 top-2", right: "right-3 top-2", size: "h-5 w-5" },
    lg: { left: "left-3 top-3", right: "right-3 top-3", size: "h-6 w-6" }
  };
  
  return (
    <div className={cn("space-y-1", fullWidth && "w-full")}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={cn(
            "absolute pointer-events-none text-gray-400",
            iconPositioning[size].left
          )}>
            <div className={iconPositioning[size].size}>
              {leftIcon}
            </div>
          </div>
        )}
        
        {/* Input Field */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseStyles,
            variantStyles[currentVariant],
            sizeStyles[size],
            iconPadding[size].left,
            iconPadding[size].right,
            className
          )}
          {...props}
        />
        
        {/* Right Icon */}
        {rightIcon && (
          <div className={cn(
            "absolute pointer-events-none text-gray-400",
            iconPositioning[size].right
          )}>
            <div className={iconPositioning[size].size}>
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {/* Helper Text / Error / Success Message */}
      {(error || success || helperText) && (
        <div className="text-xs">
          {error && (
            <p className="text-red-600 flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-600 flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </p>
          )}
          {helperText && !error && !success && (
            <p className="text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = "Input";

/**
 * Textarea component dengan styling yang konsisten
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((
  {
    variant = 'default',
    label,
    error,
    success,
    helperText,
    fullWidth = false,
    className,
    id,
    rows = 3,
    ...props
  },
  ref
) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const currentVariant = error ? 'error' : success ? 'success' : variant;
  
  const baseStyles = "w-full border rounded-lg px-4 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical";
  
  const variantStyles = {
    default: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
    error: "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50",
    success: "border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50"
  };
  
  return (
    <div className={cn("space-y-1", fullWidth && "w-full")}>
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          baseStyles,
          variantStyles[currentVariant],
          className
        )}
        {...props}
      />
      
      {(error || success || helperText) && (
        <div className="text-xs">
          {error && (
            <p className="text-red-600 flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-600 flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </p>
          )}
          {helperText && !error && !success && (
            <p className="text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = "Textarea";