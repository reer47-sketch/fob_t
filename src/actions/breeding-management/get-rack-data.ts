'use server'

import { getRackDataSchema } from './schemas'
import { getRackDataService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function getRackData(input: { zoneId?: string } = {}) {
  try {
    const validated = getRackDataSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await getRackDataService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('getRackData error:', error)
    return { success: false as const, error: '렉사 데이터 조회 실패' }
  }
}
