import { Suspense } from "react"
import { RegisterForm } from "../_components/register-form"

/**
 * Komponen loading fallback untuk RegisterForm
 */
function RegisterFormSkeleton() {
  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <div className="animate-pulse">
        <div className="bg-gray-200 h-96 rounded-lg"></div>
      </div>
    </div>
  )
}

/**
 * Halaman registrasi untuk pendaftaran user baru
 * Menggunakan grup route (auth) untuk organisasi yang lebih baik
 */
export default function RegisterPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Suspense fallback={<RegisterFormSkeleton />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}