'use server'

import { getSpeciesByCategory } from '@/services/code-service'

export async function getSpeciesByCategoryAction(categoryId: string) {
  try {
    const species = await getSpeciesByCategory(categoryId)
    return { success: true, data: species }
  } catch (error) {
    console.error('Failed to fetch species by category:', error)
    return { success: false, error: '종 조회에 실패했습니다.' }
  }
}
