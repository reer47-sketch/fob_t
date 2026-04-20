'use server'

import { updateEggSiresSchema, type UpdateEggSiresInput } from './schemas'
import { updateEggSiresService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateEggSires(input: UpdateEggSiresInput) {
  try {
    const validated = updateEggSiresSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateEggSiresService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateEggSires error:', error)
    return { success: false as const, error: '페어링 수정 실패' }
  }
}
