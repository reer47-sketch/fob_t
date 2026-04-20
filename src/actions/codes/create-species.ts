'use server'

import { createSpecies } from '@/services/code-service'
import { z } from 'zod'

const createSpeciesSchema = z.object({
  parentId: z.string().min(1, '카테고리를 선택해주세요'),
  code: z.string().min(1, '코드를 입력해주세요'),
  name: z.string().min(1, '이름을 입력해주세요'),
  scientificName: z.string().min(1, '학명을 입력해주세요'),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
})

export async function createSpeciesAction(data: z.infer<typeof createSpeciesSchema>) {
  try {
    const validated = createSpeciesSchema.parse(data)
    const species = await createSpecies(validated)
    return { success: true, data: species }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create species:', error)
    return { success: false, error: '종 생성에 실패했습니다.' }
  }
}
