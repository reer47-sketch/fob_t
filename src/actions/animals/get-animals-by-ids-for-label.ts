'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { getAnimalsByIdsForLabelService } from '@/services/animal-service'

/**
 * ID 목록으로 개체 목록 조회 액션 (라벨용 - 부모 정보 포함)
 */
export async function getAnimalsByIdsForLabel(animalIds: string[]) {
  try {
    if (!animalIds || animalIds.length === 0) {
      return { success: true, data: [] }
    }

    const session = await getCurrentUserService()
    if (!session?.success || !session.data) {
      return { success: false, error: '인증이 필요합니다' }
    }

    const tenantId = session.data.tenantId
    if (!tenantId) {
      return { success: false, error: '테넌트 정보가 없습니다' }
    }

    return await getAnimalsByIdsForLabelService(animalIds, tenantId)
  } catch (error) {
    console.error('getAnimalsByIdsForLabel error:', error)
    return { success: false, error: '개체 정보를 가져오는 중 오류가 발생했습니다' }
  }
}
