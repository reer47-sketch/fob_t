import { Suspense } from 'react'
import { ResetPasswordForm } from './_components/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">새 비밀번호 설정</h1>
          <p className="mt-2 text-sm text-gray-600">
            새로운 비밀번호를 입력하세요
          </p>
        </div>
        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
