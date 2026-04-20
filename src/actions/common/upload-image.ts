'use server'

import { uploadToR2 } from '@/lib/r2'
import { v4 as uuidv4 } from 'uuid'

type UploadResult = 
  | { success: true; url: string }
  | { success: false; error: string }

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return { success: false, error: '파일이 없습니다.' }
    }

    if (!file.type.startsWith('image/')) {
        return { success: false, error: '이미지 파일만 업로드 가능합니다.' }
    }

    // 파일명 생성: UUID + 원본 확장자
    // 혹은 원본 파일명을 sanitize해서 사용할 수도 있음
    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`
    const key = `${folder}/${fileName}`

    const url = await uploadToR2(key, file)

    return { success: true, url }
  } catch (error) {
    console.error('Image upload error:', error)
    return { success: false, error: '이미지 업로드 중 오류가 발생했습니다.' }
  }
}
