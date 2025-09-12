import { Suspense } from "react"
import { LoginForm } from "../_components/login-form"

/**
 * Komponen loading fallback untuk LoginForm
 */
function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <div className="animate-pulse">
        <div className="bg-gray-200 h-96 rounded-lg"></div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
