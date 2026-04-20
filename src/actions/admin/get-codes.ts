'use server'

import { getAllSpecies, getMorphsBySpeciesId } from '@/services/code-service'

export async function getSpeciesForBulk() {
  return await getAllSpecies()
}

export async function getMorphsForBulk(speciesId: string) {
  return await getMorphsBySpeciesId(speciesId)
}
