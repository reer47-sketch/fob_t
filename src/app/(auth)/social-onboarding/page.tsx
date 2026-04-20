import { SocialOnboardingForm } from './_components/social-onboarding-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function SocialOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }


  // 이미 가입된 유저라면 대시보드로 리다이렉트
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (existingUser) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">포브</h1>
          <p className="mt-2 text-sm text-gray-600">
            소셜 로그인 가입을 환영합니다!
          </p>
        </div>
        <SocialOnboardingForm 
          defaultName={user.user_metadata.full_name || user.user_metadata.name} 
          defaultEmail={user.email}
        />
      </div>
    </div>
  )
}
