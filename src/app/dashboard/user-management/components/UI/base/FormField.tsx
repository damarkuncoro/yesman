import React from 'react'
import { Input } from "@/components/shadcn/ui/input"
import { Label } from "@/components/shadcn/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select"

/**
 * Base props untuk semua form field
 */
interface BaseFormFieldProps {
  /** ID field untuk accessibility */
  id: string
  /** Label field */
  label: string
  /** Apakah field wajib diisi */
  required?: boolean
  /** Error message jika ada */
  error?: string
  /** Class tambahan */
  className?: string
}

/**
 * Props untuk Input field
 */
interface InputFieldProps extends BaseFormFieldProps {
  type: 'input'
  /** Tipe input HTML */
  inputType?: 'text' | 'email' | 'password'
  /** Nilai input */
  value: string
  /** Handler perubahan nilai */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Apakah field disabled */
  disabled?: boolean
}

/**
 * Props untuk Select field
 */
interface SelectFieldProps extends BaseFormFieldProps {
  type: 'select'
  /** Nilai yang dipilih */
  value: string
  /** Handler perubahan nilai */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Opsi select */
  options: Array<{
    value: string
    label: string
  }>
}

/**
 * Union type untuk semua field props
 */
type FormFieldProps = InputFieldProps | SelectFieldProps

/**
 * FormField Component
 * 
 * Reusable component untuk form field yang mengikuti prinsip DRY.
 * Menangani input dan select dengan error handling yang konsisten.
 * 
 * Prinsip SOLID yang diterapkan:
 * - SRP: Hanya bertanggung jawab untuk rendering form field
 * - OCP: Terbuka untuk extension dengan tipe field baru
 * - LSP: Setiap tipe field dapat digunakan secara bergantian
 * - ISP: Interface yang terpisah untuk setiap tipe field
 * - DIP: Bergantung pada abstraksi onChange handler
 */
export function FormField(props: FormFieldProps) {
  const { id, label, required = false, error, className = "" } = props

  /**
   * Render input field
   */
  const renderInput = (inputProps: InputFieldProps) => (
    <Input
      id={id}
      type={inputProps.inputType || 'text'}
      value={inputProps.value}
      onChange={(e) => inputProps.onChange(e.target.value)}
      placeholder={inputProps.placeholder}
      disabled={inputProps.disabled}
    />
  )

  /**
   * Render select field
   */
  const renderSelect = (selectProps: SelectFieldProps) => (
    <Select 
      value={selectProps.value} 
      onValueChange={selectProps.onChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={selectProps.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {selectProps.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>
        {label} {required && '*'}
      </Label>
      
      {props.type === 'input' && renderInput(props)}
      {props.type === 'select' && renderSelect(props)}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}