'use server'

import { createChildCode } from '@/services/code-service'
import { CodeCategory } from '@prisma/client'
import { z } from 'zod'

const createChildCodeSchema = z.object({
  parentId: z.string().min(1, '부모 ID가 필요합니다'),
  category: z.nativeEnum(CodeCategory),
  code: z.string().min(1, '코드를 입력해주세요'),
  name: z.string().min(1, '이름을 입력해주세요'),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
})

export async function createChildCodeAction(data: z.infer<typeof createChildCodeSchema>) {
  try {
    const validated = createChildCodeSchema.parse(data)
    const code = await createChildCode(validated)
    return { success: true, data: code }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to create child code:', error)
    return { success: false, error: '코드 생성에 실패했습니다.' }
  }
}
