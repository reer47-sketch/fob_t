import { ForgotPasswordForm } from './_components/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">비밀번호 찾기</h1>
          <p className="mt-2 text-sm text-gray-600">
            가입하신 이메일 주소를 입력하세요
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
