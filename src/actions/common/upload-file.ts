'use server'

import { uploadToR2 } from '@/lib/r2'
import { v4 as uuidv4 } from 'uuid'

type UploadResult = 
  | { success: true; url: string }
  | { success: false; error: string }

export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'files'

    if (!file) {
      return { success: false, error: '파일이 없습니다.' }
    }

    // 파일 타입 제한 없음 (모든 파일 허용)
    // 필요 시 여기에 허용할 MIME 타입 리스트를 체크하는 로직 추가 가능
    // 예: if (!allowedTypes.includes(file.type)) ...

    // 파일명 생성: UUID + 원본 확장자
    // 한글 파일명 호환성 등을 위해 UUID 사용 권장
    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`
    const key = `${folder}/${fileName}`

    const url = await uploadToR2(key, file)

    return { success: true, url }
  } catch (error) {
    console.error('File upload error:', error)
    return { success: false, error: '파일 업로드 중 오류가 발생했습니다.' }
  }
}
