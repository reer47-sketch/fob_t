'use server'

import { createZoneSchema, type CreateZoneInput } from './schemas'
import { createZoneService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function createZone(input: CreateZoneInput) {
  try {
    const validated = createZoneSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await createZoneService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('createZone error:', error)
    return { success: false as const, error: '구역 생성 실패' }
  }
}
