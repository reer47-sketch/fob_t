'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter, useSearchParams } from 'next/navigation'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, setIsPending] = useState(false)
  const [state, setState] = useState<{
    success: boolean
    message?: string
    error?: string
  } | null>(null)

  const supabase = createClient()

  // URL에 에러 파라미터가 있는지 체크
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'invalid_link') {
      setState({
        success: false,
        error: '링크가 유효하지 않거나 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.'
      })
    }
  }, [searchParams])

  // 비밀번호 변경 성공 시 로그인 페이지로 이동
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push('/login')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state?.success, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setState(null)

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // 클라이언트 측 유효성 검사
    if (newPassword.length < 8) {
      setState({
        success: false,
        error: '새 비밀번호는 최소 8자 이상이어야 합니다'
      })
      setIsPending(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setState({
        success: false,
        error: '비밀번호가 일치하지 않습니다'
      })
      setIsPending(false)
      return
    }

    try {
      // 서버에서 이미 세션을 설정했으므로 바로 패스워드 업데이트
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Password update error:', error)

        // 에러 메시지 세분화
        let errorMessage = '비밀번호 변경에 실패했습니다.'

        if (error.message.includes('same as the old password')) {
          errorMessage = '새 비밀번호는 이전 비밀번호와 달라야 합니다.'
        } else if (error.message.includes('Password should be')) {
          errorMessage = '비밀번호는 최소 8자 이상이어야 합니다.'
        } else if (error.message.includes('session')) {
          errorMessage = '세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.'
        } else if (error.message.includes('User not found')) {
          errorMessage = '사용자를 찾을 수 없습니다. 비밀번호 재설정을 다시 요청해주세요.'
        } else if (error.status === 422) {
          errorMessage = '새 비밀번호는 이전 비밀번호와 달라야 합니다.'
        }

        setState({
          success: false,
          error: errorMessage
        })
      } else {
        // 비밀번호 변경 성공 후 로그아웃
        await supabase.auth.signOut()

        setState({
          success: true,
          message: '비밀번호가 성공적으로 변경되었습니다. 로그인해주세요.'
        })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setState({
        success: false,
        error: '비밀번호 재설정 중 오류가 발생했습니다'
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 비밀번호 설정</CardTitle>
        <CardDescription>
          새로운 비밀번호를 입력해주세요 (최소 8자)
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending || state?.success}
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending || state?.success}
              minLength={8}
            />
          </div>

          {state && state.success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>
                {state.message}
                <br />
                <span className="text-sm">잠시 후 로그인 페이지로 이동합니다...</span>
              </AlertDescription>
            </Alert>
          )}

          {state && !state.success && state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full mt-4" disabled={isPending || state?.success}>
            {isPending ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
