'use server'

import { getPublicAnimalDetailService } from '@/services/animal-service'

/**
 * Public 개체 상세 조회 액션 (Guest용)
 * 인증 불필요, isPublic이 true인 개체만 조회 가능
 */
export async function getPublicAnimalDetail(animalId: string) {
  return getPublicAnimalDetailService(animalId)
}
