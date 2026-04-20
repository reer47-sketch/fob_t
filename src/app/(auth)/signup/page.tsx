import { SignUpForm } from './_components/signup-form'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function SignUpPage() {
  // 이미 로그인된 사용자 처리
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (dbUser) {
      redirect('/dashboard')
    } else {
      // 세션은 있지만 가입 미완료 시 세션 초기화
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">포브</h1>
          <p className="mt-2 text-sm text-gray-600">
            샵 정보를 입력하여 가입하세요
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
