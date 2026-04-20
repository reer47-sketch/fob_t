'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { bulkCreateAnimalsService } from '@/services/animal-service'
import { hasBulkFeature } from '@/lib/permissions'

interface BulkAnimalInput {
  name: string | null
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  hatchDate: string | null // ISO string
  speciesId: string
  primaryMorphId: string
  acquisitionType: 'ADOPTION' | 'HATCHING'
}

/**
 * 일괄 개체 등록 (고객용 — 유료 기능)
 */
export async function bulkCreateAnimals(
  animals: BulkAnimalInput[],
  imageFiles?: File[]
) {
  try {
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    if (!hasBulkFeature(userResult.data)) {
      return { success: false, error: '유료 기능입니다. 플랜을 업그레이드해주세요.' }
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return { success: false, error: '소속 테넌트가 없습니다.' }
    }

    if (!animals || animals.length === 0) {
      return { success: false, error: '등록할 개체가 없습니다.' }
    }

    const items = animals.map((animal, index) => ({
      name: animal.name,
      gender: animal.gender as 'MALE' | 'FEMALE' | 'UNKNOWN',
      hatchDate: animal.hatchDate ? new Date(animal.hatchDate) : null,
      speciesId: animal.speciesId,
      primaryMorphId: animal.primaryMorphId,
      acquisitionType: animal.acquisitionType as 'ADOPTION' | 'HATCHING',
      imageFile: imageFiles?.[index],
    }))

    return await bulkCreateAnimalsService(items, tenantId)
  } catch (error) {
    console.error('bulkCreateAnimals error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '일괄 등록 중 오류가 발생했습니다',
    }
  }
}
