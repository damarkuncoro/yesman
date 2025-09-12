import { ForgotPasswordForm } from "../_components/forgot-password-form"

/**
 * Halaman lupa password untuk reset password user
 * Bagian dari authentication layer dalam grup route (auth)
 */
export default function ForgotPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}