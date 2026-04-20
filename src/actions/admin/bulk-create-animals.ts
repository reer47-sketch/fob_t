'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { bulkCreateAnimalsService } from '@/services/animal-service'

interface BulkAnimalInput {
  name: string | null
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  hatchDate: string | null // ISO string
  speciesId: string
  primaryMorphId: string
  acquisitionType: 'ADOPTION' | 'HATCHING'
}

/**
 * 일괄 개체 등록 (관리자 전용)
 * 이미지는 별도로 업로드 후 URL을 연결합니다.
 */
export async function bulkCreateAnimals(
  tenantId: string,
  animals: BulkAnimalInput[],
  imageFiles?: File[]
) {
  try {
    // 1. 관리자 인증 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    if (userResult.data.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    if (!tenantId) {
      return { success: false, error: '파트너사를 선택해주세요.' }
    }

    if (!animals || animals.length === 0) {
      return { success: false, error: '등록할 개체가 없습니다.' }
    }

    // 2. 데이터 변환
    const items = animals.map((animal, index) => ({
      name: animal.name,
      gender: animal.gender as 'MALE' | 'FEMALE' | 'UNKNOWN',
      hatchDate: animal.hatchDate ? new Date(animal.hatchDate) : null,
      speciesId: animal.speciesId,
      primaryMorphId: animal.primaryMorphId,
      acquisitionType: animal.acquisitionType as 'ADOPTION' | 'HATCHING',
      imageFile: imageFiles?.[index],
    }))

    // 3. 서비스 호출
    return await bulkCreateAnimalsService(items, tenantId)
  } catch (error) {
    console.error('bulkCreateAnimals error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '일괄 등록 중 오류가 발생했습니다',
    }
  }
}
