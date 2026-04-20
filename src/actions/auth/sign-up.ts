'use server'

import { signUpSchema, type SignUpInput } from './schemas'
import { signUpService } from '@/services/auth-service'
import { z } from 'zod'

export type SignUpResponse =
  | { success: true; data: { userId: string; tenantId: string } }
  | { success: false; error: string }

/**
 * 회원가입 Action
 * @param input - 회원가입 데이터 (email, password, shopName, name, phone)
 * @returns 성공 시 userId, tenantId / 실패 시 에러 메시지
 */
export async function signUp(input: SignUpInput): Promise<SignUpResponse> {
  try {
    // 1. Validation (Actions 레이어)
    const validated = signUpSchema.parse(input)

    // 2. Business Logic (Service로 위임)
    const result = await signUpService(validated)

    return result
  } catch (error) {
    console.error('signUp action error:', error)

    if (error instanceof z.ZodError) {
      // 첫 번째 에러 메시지만 표시 (사용자 친화적)
      const firstError = error.issues[0]
      return { success: false, error: firstError.message }
    }

    return { success: false, error: '회원가입에 실패했습니다' }
  }
}
