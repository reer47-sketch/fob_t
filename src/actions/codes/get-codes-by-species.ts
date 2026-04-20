'use server'

import {
  getMorphsBySpeciesId,
  getTraitsBySpeciesId,
  getColorsBySpeciesId,
} from '@/services/code-service'

export async function getTraitsAndColorsBySpeciesId(speciesId: string) {
  try {
    const [morphs, traits, colors] = await Promise.all([
      getMorphsBySpeciesId(speciesId),
      getTraitsBySpeciesId(speciesId),
      getColorsBySpeciesId(speciesId),
    ])

    return {
      success: true,
      data: {
        morphs,
        traits,
        colors,
      },
    }
  } catch (error) {
    console.error('Error fetching morphs, traits and colors:', error)
    return {
      success: false,
      error: '코드 정보를 불러오는데 실패했습니다.',
    }
  }
}
