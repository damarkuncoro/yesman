"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

/**
 * Props untuk ThemeToggle component
 */
interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * ThemeToggle component untuk toggle dark/light mode
 * Menggunakan useTheme hook untuk mengakses theme context
 */
export function ThemeToggle({ 
  className,
  size = 'md',
  showLabel = false 
}: ThemeToggleProps) {
  const { mode, isDark, isLoading, setTheme, toggleTheme } = useTheme();

  /**
   * Handler untuk cycle theme modes: light -> dark -> system -> light
   */
  const handleThemeChange = () => {
    switch (mode) {
      case 'light':
        setTheme('dark');
        break;
      case 'dark':
        setTheme('system');
        break;
      case 'system':
        setTheme('light');
        break;
      default:
        setTheme('light');
    }
  };

  /**
   * Get icon berdasarkan current theme mode
   */
  const getThemeIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      );
    }

    switch (mode) {
      case 'light':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  /**
   * Get label berdasarkan current theme mode
   */
  const getThemeLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Theme';
    }
  };

  /**
   * Get tooltip text
   */
  const getTooltipText = () => {
    switch (mode) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to system mode';
      case 'system':
        return 'Switch to light mode';
      default:
        return 'Change theme';
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        onClick={handleThemeChange}
        variant="ghost"
        size={size}
        disabled={isLoading}
        title={getTooltipText()}
        className={cn(
          "transition-all duration-200",
          isDark && "text-yellow-400 hover:text-yellow-300",
          !isDark && "text-gray-600 hover:text-gray-800"
        )}
      >
        <div className="flex items-center space-x-2">
          {getThemeIcon()}
          {showLabel && (
            <span className="text-sm font-medium">
              {getThemeLabel()}
            </span>
          )}
        </div>
      </Button>
    </div>
  );
}

/**
 * Simple ThemeToggle component yang hanya toggle antara light dan dark
 */
export function SimpleThemeToggle({ className }: { className?: string }) {
  const { isDark, isLoading, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      disabled={isLoading}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        "transition-all duration-200",
        isDark && "text-yellow-400 hover:text-yellow-300",
        !isDark && "text-gray-600 hover:text-gray-800",
        className
      )}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : isDark ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </Button>
  );
}

/**
 * ThemeSelector component dengan dropdown untuk memilih theme
 */
export function ThemeSelector({ className }: { className?: string }) {
  const { mode, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ] as const;

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {themes.map((theme) => (
        <Button
          key={theme.value}
          onClick={() => setTheme(theme.value)}
          variant={mode === theme.value ? "primary" : "ghost"}
          size="sm"
          title={`Switch to ${theme.label.toLowerCase()} mode`}
          className="min-w-0"
        >
          <span className="text-sm">{theme.icon}</span>
        </Button>
      ))}
    </div>
  );
}