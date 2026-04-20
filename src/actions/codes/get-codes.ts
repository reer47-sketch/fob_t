'use server'

import { getAllSpecies, getMorphsBySpeciesId } from '@/services/code-service'

export async function getSpeciesList() {
  return await getAllSpecies()
}

export async function getMorphsBySpecies(speciesId: string) {
  return await getMorphsBySpeciesId(speciesId)
}
