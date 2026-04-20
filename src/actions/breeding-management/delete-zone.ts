'use server'

import { deleteZoneSchema, type DeleteZoneInput } from './schemas'
import { deleteZoneService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function deleteZone(input: DeleteZoneInput) {
  try {
    const validated = deleteZoneSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await deleteZoneService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('deleteZone error:', error)
    return { success: false as const, error: '구역 삭제 실패' }
  }
}
