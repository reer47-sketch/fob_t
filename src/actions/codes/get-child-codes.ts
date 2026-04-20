'use server'

import { getAllChildCodesBySpeciesId } from '@/services/code-service'

export async function getChildCodesAction(speciesId: string) {
  try {
    if (!speciesId) {
      return { success: false, error: 'Species ID is required' }
    }

    const codes = await getAllChildCodesBySpeciesId(speciesId)
    return { success: true, data: codes }
  } catch (error) {
    console.error('Failed to fetch child codes:', error)
    return { success: false, error: 'Failed to fetch child codes' }
  }
}
