'use server'

import { getAnimalsSchema, type GetAnimalsInput } from './schemas'
import { getAnimalsService, type AnimalListResult } from '@/services/animal-service'
import { getCurrentUserService } from '@/services/auth-service'

export type GetAnimalsResponse =
  | { success: true; data: AnimalListResult }
  | { success: false; error: string }

/**
 * 개체 목록 조회 Server Action
 */
export async function getAnimals(
  input: GetAnimalsInput
): Promise<GetAnimalsResponse> {
  try {
    // 1. Validation
    const validated = getAnimalsSchema.parse(input)

    // 2. Authorization - 현재 사용자 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    // BREEDER는 자신의 tenant만, ADMIN은 모든 tenant 조회 가능
    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    // 3. Business Logic (Service로 위임)
    const result = await getAnimalsService(validated, tenantId)

    return result
  } catch (error) {
    console.error('getAnimals error:', error)
    return { success: false, error: 'Failed to fetch animals' }
  }
}
