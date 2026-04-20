'use server'

import { getBreedingsSchema, type GetBreedingsInput } from './schemas'
import { getBreedingsService, type BreedingListResult } from '@/services/breeding-service'
import { getCurrentUserService } from '@/services/auth-service'

export type GetBreedingsResponse =
  | { success: true; data: BreedingListResult }
  | { success: false; error: string }

/**
 * 브리딩 자식 개체 목록 조회 Server Action
 */
export async function getBreedings(
  input: GetBreedingsInput
): Promise<GetBreedingsResponse> {
  try {
    // 1. Validation
    const validated = getBreedingsSchema.parse(input)

    // 2. Authorization - 현재 사용자 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    // BREEDER는 자신의 tenant만 조회 가능
    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    // 3. Business Logic (Service로 위임)
    const result = await getBreedingsService(validated, tenantId)

    return result
  } catch (error) {
    console.error('getBreedings error:', error)
    return { success: false, error: 'Failed to fetch breedings' }
  }
}
