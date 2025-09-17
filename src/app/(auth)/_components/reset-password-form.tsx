"use client"

import { useState } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/shadcn/ui/button"
import { Card, CardContent } from "@/components/shadcn/ui/card"
import { Input } from "@/components/shadcn/ui/input"
import { Label } from "@/components/shadcn/ui/label"
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert"
import { useAuthForm, useAuthValidation, authValidationRules } from '../_hook'

/**
 * Interface untuk data form reset password
 */
interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

/**
 * Komponen form reset password dengan validasi dan toast notifications
 * Mengikuti prinsip SRP, DRY, dan SOLID
 */
export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // State untuk form data
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: ''
  })

  // Custom hooks untuk mengelola form state dan lifecycle
  const { isLoading, error, success, handleSubmit } = useAuthForm()
  
  // Custom hook untuk validasi form dengan toast notifications
  const { 
    validateFormWithToast, 
    handleFieldChange, 
    errors, 
    touched, 
    showSuccessToast 
  } = useAuthValidation({
    password: authValidationRules.password,
    confirmPassword: authValidationRules.confirmPassword
  })

  /**
   * Handler untuk perubahan input field
   * @param field - Nama field yang berubah
   * @param value - Nilai baru field
   */
  const handleInputChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    handleFieldChange(field, value)
  }

  /**
   * Handler untuk submit form reset password
   * @param e - Form submit event
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi form sebelum submit dengan toast notification
    const validation = validateFormWithToast({
      password: formData.password,
      confirmPassword: formData.confirmPassword
    })
    if (!validation.isValid) {
      return
    }

    await handleSubmit(async () => {
      // Simulasi API call untuk reset password
      // TODO: Implement actual reset password API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Tampilkan success toast
      showSuccessToast('Password berhasil direset! Silakan login dengan password baru.')
    })
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Reset Password</h1>
                <p className="text-muted-foreground text-balance">
                  Masukkan password baru Anda di bawah ini
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
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-3">
                <Label htmlFor="password">Password Baru</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password baru"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={cn(
                    errors.password && touched.password && "border-destructive"
                  )}
                  required
                />
                {errors.password && touched.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Konfirmasi password baru"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={cn(
                    errors.confirmPassword && touched.confirmPassword && "border-destructive"
                  )}
                  required
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Mereset...' : 'Reset Password'}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Ingat password Anda? </span>
                <a
                  href="/login"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  Kembali ke login
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Export default untuk kompatibilitas import
export default ResetPasswordForm