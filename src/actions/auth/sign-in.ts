'use server'

import { signInSchema, type SignInInput } from './schemas'
import { signInService } from '@/services/auth-service'
import { z } from 'zod'
import { redirect } from 'next/navigation'

export type SignInResponse =
  | { success: true; data: { user: any; status: string } }
  | { success: false; error: string }

/**
 * 로그인 Action
 * @param input - 로그인 데이터 (email, password)
 * @returns 성공 시 user, status / 실패 시 에러 메시지
 */
export async function signIn(input: SignInInput): Promise<SignInResponse> {
  try {
    // 1. Validation (Actions 레이어)
    const validated = signInSchema.parse(input)

    // 2. Business Logic (Service로 위임)
    const result = await signInService(validated)

    if (!result.success) {
      // 상태별 리다이렉트
      if (result.error === 'pending') {
        redirect('/pending')
      }
      if (result.error === 'rejected') {
        redirect('/rejected')
      }
    }

    return result
  } catch (error) {
    console.error('signIn action error:', error)

    // Next.js redirect는 에러를 throw하므로 다시 던져야 함
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }

    return { success: false, error: '로그인에 실패했습니다' }
  }
}
