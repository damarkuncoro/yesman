"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Variant untuk card styling
 */
type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

/**
 * Ukuran padding untuk card
 */
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Props untuk Card component
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  clickable?: boolean;
  children: React.ReactNode;
}

/**
 * Modern Card component untuk container dan layout
 * Mendukung berbagai variant dan interaksi
 */
export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  className,
  children,
  ...props
}: CardProps) {
  
  /**
   * Base styles untuk card
   */
  const baseStyles = "rounded-lg transition-all duration-200";
  
  /**
   * Variant styles
   */
  const variantStyles = {
    default: "bg-white border border-gray-200",
    outlined: "bg-white border-2 border-gray-300",
    elevated: "bg-white shadow-lg border border-gray-100",
    filled: "bg-gray-50 border border-gray-200"
  };
  
  /**
   * Padding styles
   */
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8"
  };
  
  /**
   * Interactive styles
   */
  const interactiveStyles = {
    hover: hover ? "hover:shadow-md hover:border-gray-300" : "",
    clickable: clickable ? "cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.98]" : ""
  };
  
  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        interactiveStyles.hover,
        interactiveStyles.clickable,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header component
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between pb-4 border-b border-gray-200",
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Card Content component
 */
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div
      className={cn("py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Footer component
 */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({
  className,
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn(
        "pt-4 border-t border-gray-200 flex items-center justify-end gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Stats Card component untuk menampilkan statistik
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  className
}: StatsCardProps) {
  const changeColors = {
    increase: "text-green-600 bg-green-100",
    decrease: "text-red-600 bg-red-100",
    neutral: "text-gray-600 bg-gray-100"
  };
  
  const changeIcons = {
    increase: (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ),
    decrease: (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    neutral: (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    )
  };
  
  return (
    <Card variant="elevated" className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                changeColors[change.type]
              )}>
                {changeIcons[change.type]}
                {change.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}