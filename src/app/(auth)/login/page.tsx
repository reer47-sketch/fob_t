import { LoginForm } from './_components/login-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const errorMessage = params.message as string
  const errorType = params.error as string

  // 무한 리다이렉트 방지 및 자동 로그인 처리
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // DB에 유저 정보가 있는지 확인
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (dbUser) {
      // 이미 가입 완료된 유저라면 대시보드로 이동
      redirect('/dashboard')
    } else {
      // Supabase 세션은 있지만 DB 정보가 없는 경우 (온보딩 미완료)
      // 로그인 페이지를 직접 찾아왔다면 세션을 초기화하여 새롭게 시작할 수 있게 함
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">포브</h1>
          <p className="mt-2 text-sm text-gray-600">로그인하여 시작하세요</p>
        </div>

        {/* 에러 메시지가 있을 경우 표시 */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>로그인 오류</AlertTitle>
            <AlertDescription>
              {decodeURIComponent(errorMessage)}
            </AlertDescription>
          </Alert>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
