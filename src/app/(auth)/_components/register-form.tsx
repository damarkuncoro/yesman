"use client"

import { useState } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/shadcn/ui/button"
import { Card, CardContent } from "@/components/shadcn/ui/card"
import { Input } from "@/components/shadcn/ui/input"
import { Label } from "@/components/shadcn/ui/label"
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert"
import { useAuth } from "@/contexts/AuthContext"
import { useAuthForm, useAuthValidation, useAuthRedirect, authValidationRules } from '../_hook'

/**
 * Interface untuk data form registrasi
 */
interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

/**
 * Komponen form registrasi dengan validasi dan toast notifications
 * Mengikuti prinsip SRP, DRY, dan SOLID
 */
export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // State untuk form data
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Custom hooks untuk mengelola form state dan lifecycle
  const { register, isLoading: authLoading } = useAuth()
  const { isLoading, error, success, handleSubmit, setError, resetState } = useAuthForm()
  
  // Custom hook untuk validasi form dengan toast notifications
  const { 
    validateFormWithToast, 
    validateField, 
    handleFieldChange, 
    errors, 
    touched, 
    showSuccessToast 
  } = useAuthValidation({
    name: authValidationRules.name,
    email: authValidationRules.email,
    password: authValidationRules.password,
    confirmPassword: {
      ...authValidationRules.confirmPassword,
      custom: (value: string) => {
        if (value !== formData.password) {
          return 'Konfirmasi password tidak cocok'
        }
        return null
      }
    }
  })
  
  // Custom hook untuk redirect management
  const { redirectAfterLogin } = useAuthRedirect()

  /**
   * Handler untuk perubahan input field
   * @param field - Nama field yang berubah
   * @param value - Nilai baru field
   */
  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    handleFieldChange(field, value)
  }

  /**
   * Handler untuk submit form registrasi
   * @param e - Form submit event
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi form sebelum submit dengan toast notification
    const validation = validateFormWithToast({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    })
    if (!validation.isValid) {
      return
    }

    await handleSubmit(async () => {
      // Gunakan AuthContext untuk registrasi
      await register(formData.name, formData.email, formData.password)
      
      // Tampilkan success toast
      showSuccessToast('Registrasi berhasil! Silakan login.')
      
      // Redirect ke halaman login setelah registrasi berhasil
      window.location.href = '/login'
    })
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-muted-foreground text-balance">
                  Sign up for your YesMan account
                </p>
              </div>
              
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>Registrasi berhasil! Mengalihkan ke login...</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name && touched.name ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.name && touched.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email && touched.email ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.email && touched.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password && touched.password ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required 
                />
                {errors.password && touched.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required 
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <a
                  href="/login"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  Sign in
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Register illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}