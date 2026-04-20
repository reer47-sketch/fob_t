'use server'

import { updateEggSireSchema, type UpdateEggSireInput } from './schemas'
import { updateEggSireService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateEggSire(input: UpdateEggSireInput) {
  try {
    const validated = updateEggSireSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateEggSireService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateEggSire error:', error)
    return { success: false as const, error: '알 아비 변경 실패' }
  }
}
