'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from '@/actions/auth/request-password-reset'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await requestPasswordReset({
        email: formData.get('email') as string,
      })
      return result
    },
    null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>비밀번호 재설정</CardTitle>
        <CardDescription>
          이메일로 비밀번호 재설정 링크를 보내드립니다
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              disabled={isPending}
            />
          </div>

          {state && state.success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {state && !state.success && state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending ? '전송 중...' : '재설정 링크 보내기'}
          </Button>

          <div className="text-center text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
