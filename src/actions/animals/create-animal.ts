'use server'

import { ZodError } from 'zod'
import { getCurrentUserService } from '@/services/auth-service'
import { createAnimalSchema, type CreateAnimalInput } from './schemas'
import { createAnimalService } from '@/services/animal-service'

/**
 * 개체 생성 액션
 */
export async function createAnimal(input: CreateAnimalInput) {
  try {
    // 1. 입력 검증
    const validated = createAnimalSchema.parse(input)

    // 2. 사용자 인증 및 테넌트 정보 가져오기
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: '로그인이 필요합니다. 다시 로그인해주세요.',
      }
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return {
        success: false,
        error: '샵 정보가 없습니다. 관리자에게 문의해주세요.',
      }
    }

    // 3. 서비스 호출
    const result = await createAnimalService(validated, tenantId)

    return result
  } catch (error) {
    console.error('createAnimal error:', error)

    // Zod 검증 에러
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0]
      return {
        success: false,
        error: firstIssue?.message || '입력 데이터가 올바르지 않습니다.',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '개체 생성 중 오류가 발생했습니다',
    }
  }
}
