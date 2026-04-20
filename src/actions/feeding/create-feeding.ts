'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { createFeedingSchema, type CreateFeedingInput } from './schemas'
import { createFeedingsService } from '@/services/feeding-service'

/**
 * 피딩 생성 액션
 */
export async function createFeeding(input: CreateFeedingInput) {
  try {
    // 1. 입력 검증
    const validated = createFeedingSchema.parse(input)

    // 2. 사용자 인증 및 테넌트 정보 가져오기
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: '인증이 필요합니다',
      }
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return {
        success: false,
        error: '테넌트 정보가 없습니다',
      }
    }

    // 3. 서비스 호출
    const result = await createFeedingsService(validated, tenantId)

    return result
  } catch (error) {
    console.error('createFeeding error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '피딩 저장 중 오류가 발생했습니다',
    }
  }
}
