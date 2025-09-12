import { RegisterForm } from "../_components/register-form"

/**
 * Halaman registrasi untuk pendaftaran user baru
 * Menggunakan grup route (auth) untuk organisasi yang lebih baik
 */
export default function RegisterPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <RegisterForm />
      </div>
    </div>
  )
}