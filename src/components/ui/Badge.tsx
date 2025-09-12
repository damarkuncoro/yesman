"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Variant untuk badge styling
 */
type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'outline';

/**
 * Ukuran untuk badge
 */
type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Props untuk Badge component
 */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}

/**
 * Modern Badge component untuk status, label, dan tags
 * Mendukung berbagai variant dan ukuran
 */
export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className,
  children,
  ...props
}: BadgeProps) {
  
  /**
   * Base styles untuk badge
   */
  const baseStyles = "inline-flex items-center font-medium rounded-full transition-all duration-200";
  
  /**
   * Variant styles
   */
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-cyan-100 text-cyan-800",
    outline: "border border-gray-300 text-gray-700 bg-white"
  };
  
  /**
   * Size styles
   */
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2"
  };
  
  /**
   * Dot indicator component
   */
  const DotIndicator = () => {
    const dotColors = {
      default: "bg-gray-400",
      primary: "bg-blue-500",
      secondary: "bg-gray-400",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
      info: "bg-cyan-500",
      outline: "bg-gray-400"
    };
    
    const dotSizes = {
      sm: "h-1.5 w-1.5",
      md: "h-2 w-2",
      lg: "h-2.5 w-2.5"
    };
    
    return (
      <span className={cn(
        "rounded-full flex-shrink-0",
        dotColors[variant],
        dotSizes[size]
      )} />
    );
  };
  
  /**
   * Remove button component
   */
  const RemoveButton = () => {
    const buttonSizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-4 w-4"
    };
    
    return (
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
        aria-label="Remove badge"
      >
        <svg 
          className={cn("text-current", buttonSizes[size])} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>
    );
  };
  
  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <DotIndicator />}
      <span className="truncate">{children}</span>
      {removable && onRemove && <RemoveButton />}
    </span>
  );
}

/**
 * Status Badge component untuk status spesifik
 */
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'draft';
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  className
}: StatusBadgeProps) {
  const statusConfig = {
    active: { variant: 'success' as BadgeVariant, label: 'Aktif', dot: true },
    inactive: { variant: 'default' as BadgeVariant, label: 'Tidak Aktif', dot: true },
    pending: { variant: 'warning' as BadgeVariant, label: 'Menunggu', dot: true },
    approved: { variant: 'success' as BadgeVariant, label: 'Disetujui', dot: false },
    rejected: { variant: 'error' as BadgeVariant, label: 'Ditolak', dot: false },
    draft: { variant: 'secondary' as BadgeVariant, label: 'Draft', dot: false }
  };
  
  const config = statusConfig[status];
  
  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Role Badge component untuk menampilkan role user
 */
interface RoleBadgeProps {
  role: string;
  size?: BadgeSize;
  className?: string;
}

export function RoleBadge({
  role,
  size = 'sm',
  className
}: RoleBadgeProps) {
  // Mapping role ke variant
  const getRoleVariant = (role: string): BadgeVariant => {
    const lowerRole = role.toLowerCase();
    
    if (lowerRole.includes('admin')) return 'error';
    if (lowerRole.includes('manager')) return 'warning';
    if (lowerRole.includes('user')) return 'primary';
    if (lowerRole.includes('guest')) return 'secondary';
    
    return 'default';
  };
  
  return (
    <Badge
      variant={getRoleVariant(role)}
      size={size}
      className={className}
    >
      {role}
    </Badge>
  );
}

/**
 * Count Badge component untuk menampilkan angka/counter
 */
interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = 'error',
  size = 'sm',
  className
}: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  if (count === 0) {
    return null;
  }
  
  return (
    <Badge
      variant={variant}
      size={size}
      className={cn("min-w-[1.25rem] justify-center", className)}
    >
      {displayCount}
    </Badge>
  );
}