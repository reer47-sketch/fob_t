'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { replaceAnimalImageService } from '@/services/animal-service'

/**
 * 개체 이미지 교체 액션
 */
export async function replaceAnimalImage(imageId: string, newImageFile: File) {
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
    const result = await replaceAnimalImageService(imageId, tenantId, newImageFile)

    return result
  } catch (error) {
    console.error('replaceAnimalImage error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 교체 중 오류가 발생했습니다',
    }
  }
}
