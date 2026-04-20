'use server'

import { getAnimalBreedingHistorySchema } from './schemas'
import { getAnimalBreedingHistoryService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function getAnimalBreedingHistory(input: { animalId: string }) {
  try {
    const validated = getAnimalBreedingHistorySchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await getAnimalBreedingHistoryService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('getAnimalBreedingHistory error:', error)
    return { success: false as const, error: '브리딩 기록 조회 실패' }
  }
}
