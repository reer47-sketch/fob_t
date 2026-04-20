'use server'

import { updateCode } from '@/services/code-service'
import { z } from 'zod'

const updateCodeSchema = z.object({
  id: z.string().min(1, 'ID가 필요합니다'),
  code: z.string().min(1, '코드를 입력해주세요').optional(),
  name: z.string().min(1, '이름을 입력해주세요').optional(),
  scientificName: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
})

export async function updateCodeAction(data: z.infer<typeof updateCodeSchema>) {
  try {
    const { id, ...rest } = updateCodeSchema.parse(data)
    const code = await updateCode(id, rest)
    return { success: true, data: code }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to update code:', error)
    return { success: false, error: '코드 수정에 실패했습니다.' }
  }
}
