'use server'

import { updateEggFertilitySchema, type UpdateEggFertilityInput } from './schemas'
import { updateEggFertilityService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateEggFertility(input: UpdateEggFertilityInput) {
  try {
    const validated = updateEggFertilitySchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateEggFertilityService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateEggFertility error:', error)
    return { success: false as const, error: '캔들링 업데이트 실패' }
  }
}
