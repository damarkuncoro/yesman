import React from 'react'
import { Input } from "@/components/shadcn/ui/input"
import { Label } from "@/components/shadcn/ui/label"
import { Button } from "@/components/shadcn/ui/button"
import { IconEye, IconEyeOff } from "@tabler/icons-react"

/**
 * Props untuk PasswordField component
 * Mengikuti prinsip Interface Segregation Principle (ISP)
 */
interface PasswordFieldProps {
  /** ID field untuk accessibility */
  id: string
  /** Label field */
  label: string
  /** Apakah field wajib diisi */
  required?: boolean
  /** Nilai input */
  value: string
  /** Handler perubahan nilai */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Error message jika ada */
  error?: string
  /** Apakah password terlihat */
  isVisible: boolean
  /** Handler toggle visibility */
  onToggleVisibility: () => void
  /** Apakah field disabled */
  disabled?: boolean
  /** Class tambahan */
  className?: string
  /** Text untuk accessibility pada tombol toggle */
  toggleAriaLabel: string
}

/**
 * PasswordField Component - Reusable password input dengan toggle visibility
 * 
 * Mengikuti prinsip:
 * - SRP: Hanya bertanggung jawab untuk password input dengan visibility toggle
 * - DRY: Reusable untuk semua password fields
 * - SOLID: Interface yang jelas dan extensible
 */
export function PasswordField({
  id,
  label,
  required = false,
  value,
  onChange,
  placeholder,
  error,
  isVisible,
  onToggleVisibility,
  disabled = false,
  className = "",
  toggleAriaLabel
}: PasswordFieldProps) {
  
  /**
   * Handle input change
   * Mengikuti prinsip SRP
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Input dengan tombol toggle */}
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-10 ${error ? 'border-red-500' : ''}`}
        />
        
        {/* Tombol toggle visibility */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={toggleAriaLabel}
        >
          {isVisible ? (
            <IconEyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <IconEye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}