'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { uploadAnimalImageService } from '@/services/animal-service'

/**
 * 개체 이미지 업로드 액션
 */
export async function uploadAnimalImage(animalId: string, imageFile: File) {
  try {
    // 1. 사용자 인증 및 테넌트 정보 가져오기
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

    // 2. 서비스 호출
    const result = await uploadAnimalImageService(animalId, tenantId, imageFile)

    return result
  } catch (error) {
    console.error('uploadAnimalImage error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다',
    }
  }
}
