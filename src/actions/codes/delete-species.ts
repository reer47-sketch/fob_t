'use server'

import { deleteSpecies } from '@/services/code-service'

export async function deleteSpeciesAction(id: string) {
  try {
    await deleteSpecies(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete species:', error)
    const message = error instanceof Error ? error.message : '종 삭제에 실패했습니다.'
    return { success: false, error: message }
  }
}
