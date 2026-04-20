'use client'

import { useActionState } from 'react'
import { signIn } from '@/actions/auth/sign-in'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { SocialLogin } from '../../_components/social-login'

/**
 * 로그인 폼
 */
export function LoginForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await signIn({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      })

      if (result.success) {
        // 역할에 따라 리다이렉트
        if (result.data.user.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }

      return result
    },
    null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>이메일과 비밀번호를 입력하세요</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-bold">비밀번호</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                비밀번호 찾기
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          {state && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 mt-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '로그인 중...' : '로그인'}
          </Button>

          <SocialLogin />

          <div className="text-center text-sm text-gray-600">
            이메일로 가입하시겠어요?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
