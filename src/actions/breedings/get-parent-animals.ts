'use server'

import { getParentAnimalsSchema, type GetParentAnimalsInput } from './schemas'
import { getParentAnimalsService, type ParentAnimal } from '@/services/breeding-service'
import { getCurrentUserService } from '@/services/auth-service'

export type GetParentAnimalsResponse =
  | { success: true; data: ParentAnimal[] }
  | { success: false; error: string }

/**
 * 부모 후보 개체 목록 조회 Server Action
 */
export async function getParentAnimals(
  input: GetParentAnimalsInput
): Promise<GetParentAnimalsResponse> {
  try {
    // 1. Validation
    const validated = getParentAnimalsSchema.parse(input)

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
    const result = await getParentAnimalsService(validated, tenantId)

    return result
  } catch (error) {
    console.error('getParentAnimals error:', error)
    return { success: false, error: 'Failed to fetch parent animals' }
  }
}
