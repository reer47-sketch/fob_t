'use server'

import { createCategory } from '@/services/code-service'
import { z } from 'zod'

const createCategorySchema = z.object({
  code: z.string().min(1, '코드를 입력해주세요'),
  name: z.string().min(1, '이름을 입력해주세요'),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
})

export async function createCategoryAction(data: z.infer<typeof createCategorySchema>) {
  try {
    const validated = createCategorySchema.parse(data)
    const category = await createCategory(validated)
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create category:', error)
    return { success: false, error: '카테고리 생성에 실패했습니다.' }
  }
}
