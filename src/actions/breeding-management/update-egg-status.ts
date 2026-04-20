'use server'

import { updateEggStatusSchema, type UpdateEggStatusInput } from './schemas'
import { updateEggStatusService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateEggStatus(input: UpdateEggStatusInput) {
  try {
    const validated = updateEggStatusSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateEggStatusService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateEggStatus error:', error)
    return { success: false as const, error: '알 상태 변경 실패' }
  }
}
