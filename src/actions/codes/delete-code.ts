'use server'

import { deleteCode } from '@/services/code-service'

export async function deleteCodeAction(id: string) {
  try {
    await deleteCode(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete code:', error)
    const message = error instanceof Error ? error.message : '코드 삭제에 실패했습니다.'
    return { success: false, error: message }
  }
}
