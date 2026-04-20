'use server'

import { updateEggMemoSchema, type UpdateEggMemoInput } from './schemas'
import { updateEggMemoService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateEggMemo(input: UpdateEggMemoInput) {
  try {
    const validated = updateEggMemoSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateEggMemoService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateEggMemo error:', error)
    return { success: false as const, error: '메모 수정 실패' }
  }
}
