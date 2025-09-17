/**
 * Shared Types untuk Form Components
 * 
 * File ini berisi semua type dan interface yang digunakan bersama
 * oleh komponen-komponen form untuk menghindari duplikasi dan
 * memastikan konsistensi tipe data.
 */

/**
 * Base props yang dimiliki semua form component
 */
export interface BaseFormProps {
  /** Mode form: create atau edit */
  mode: 'create' | 'edit'
  /** Data form */
  formData: any
  /** Error messages */
  errors: Record<string, string>
  /** Handler untuk perubahan input */
  handleInputChange: (field: string, value: string) => void
}

/**
 * Props untuk form yang memiliki role assignment
 */
export interface RoleAssignmentFormProps extends BaseFormProps {
  /** Handler untuk perubahan role */
  handleRoleChange: (roleId: string, checked: boolean) => void
  /** Daftar role yang tersedia */
  availableRoles: Array<{
    id: string
    name: string
    description?: string
  }>
}

/**
 * Props untuk form actions (submit, cancel, dll)
 */
export interface FormActionsProps {
  /** Apakah form sedang loading */
  loading: boolean
  /** Mode form */
  mode: 'create' | 'edit'
  /** Handler submit */
  onSubmit: (e: React.FormEvent) => void
  /** Handler cancel */
  onCancel: () => void
  /** Nama-nama role yang dipilih untuk preview */
  selectedRoleNames?: string[]
}

/**
 * Props untuk loading state component
 */
export interface LoadingStateProps {
  /** Pesan loading custom */
  message?: string
  /** Apakah menampilkan skeleton */
  showSkeleton?: boolean
}

/**
 * Common field configuration untuk form
 */
export interface FieldConfig {
  /** Nama field */
  name: string
  /** Label field */
  label: string
  /** Tipe field */
  type: 'text' | 'email' | 'password' | 'select'
  /** Apakah wajib diisi */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Opsi untuk select field */
  options?: Array<{
    value: string
    label: string
  }>
  /** Apakah field disabled */
  disabled?: boolean
}

/**
 * Configuration untuk form section
 */
export interface FormSectionConfig {
  /** Judul section */
  title: string
  /** Deskripsi section */
  description?: string
  /** Icon section */
  icon?: React.ReactNode
  /** Daftar field dalam section */
  fields: FieldConfig[]
}

/**
 * Generic form data structure
 */
export interface GenericFormData {
  [key: string]: string | string[] | boolean | number
}

/**
 * Form validation result
 */
export interface ValidationResult {
  /** Apakah valid */
  isValid: boolean
  /** Error messages per field */
  errors: Record<string, string>
}

/**
 * Form state untuk loading dan error handling
 */
export interface FormState {
  /** Apakah sedang loading */
  loading: boolean
  /** Apakah sedang fetch data */
  loadingData: boolean
  /** Error message global */
  error: string | null
  /** Apakah form sudah disubmit */
  submitted: boolean
}