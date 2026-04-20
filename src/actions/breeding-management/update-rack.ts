'use server'

import { updateRackSchema, type UpdateRackInput } from './schemas'
import { updateRackService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateRack(input: UpdateRackInput) {
  try {
    const validated = updateRackSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateRackService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateRack error:', error)
    return { success: false as const, error: '렉사 수정 실패' }
  }
}
