'use server'

import { updateZoneSchema, type UpdateZoneInput } from './schemas'
import { updateZoneService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateZone(input: UpdateZoneInput) {
  try {
    const validated = updateZoneSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateZoneService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateZone error:', error)
    return { success: false as const, error: '구역 수정 실패' }
  }
}
