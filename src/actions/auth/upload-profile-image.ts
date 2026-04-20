'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { uploadToR2 } from '@/lib/r2'

/**
 * 프로필 이미지 업로드 액션
 */
export async function uploadProfileImage(imageFile: File) {
  try {
    // 1. 사용자 인증
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: '인증이 필요합니다',
      }
    }

    const userId = userResult.data.id

    // 2. 파일 검증
    if (!imageFile.type.startsWith('image/')) {
      return {
        success: false,
        error: '이미지 파일만 업로드할 수 있습니다',
      }
    }

    // 3. 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024
    if (imageFile.size > maxSize) {
      return {
        success: false,
        error: '파일 크기는 5MB 이하여야 합니다',
      }
    }

    // 4. R2에 업로드
    const timestamp = Date.now()
    const key = `profiles/${userId}/${timestamp}-${imageFile.name}`
    const imageUrl = await uploadToR2(key, imageFile, imageFile.type)

    return {
      success: true,
      data: { imageUrl },
    }
  } catch (error) {
    console.error('uploadProfileImage error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다',
    }
  }
}
