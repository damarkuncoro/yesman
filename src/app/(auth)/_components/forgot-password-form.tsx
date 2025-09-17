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
 * Interface untuk data form forgot password
 */
interface ForgotPasswordFormData {
  email: string
}

/**
 * Komponen form lupa password dengan validasi dan toast notifications
 * Mengikuti prinsip SRP, DRY, dan SOLID
 */
export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // State untuk form data
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: ''
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
    email: authValidationRules.email
  })

  /**
   * Handler untuk perubahan input field
   * @param field - Nama field yang berubah
   * @param value - Nilai baru field
   */
  const handleInputChange = (field: keyof ForgotPasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    handleFieldChange(field, value)
  }

  /**
   * Handler untuk submit form forgot password
   * @param e - Form submit event
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi form sebelum submit dengan toast notification
    const validation = validateFormWithToast({
      email: formData.email
    })
    if (!validation.isValid) {
      return
    }

    await handleSubmit(async () => {
      // Simulasi API call untuk forgot password
      // TODO: Implement actual forgot password API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Tampilkan success toast
      showSuccessToast('Link reset password telah dikirim ke email Anda!')
    })
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Lupa Password</h1>
                <p className="text-muted-foreground text-balance">
                  Masukkan alamat email Anda dan kami akan mengirimkan link untuk reset password
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(
                    errors.email && touched.email && "border-destructive"
                  )}
                  required
                />
                {errors.email && touched.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
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