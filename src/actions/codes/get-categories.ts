'use server'

import { getCategories } from '@/services/code-service'

export async function getCategoriesAction() {
  try {
    const categories = await getCategories()
    return { success: true, data: categories }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return { success: false, error: '카테고리 조회에 실패했습니다.' }
  }
}
