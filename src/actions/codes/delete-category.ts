'use server'

import { deleteCategory } from '@/services/code-service'

export async function deleteCategoryAction(id: string) {
  try {
    await deleteCategory(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete category:', error)
    const message = error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.'
    return { success: false, error: message }
  }
}
