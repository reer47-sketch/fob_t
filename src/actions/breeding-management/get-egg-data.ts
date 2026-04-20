'use server'

import { getEggDataSchema } from './schemas'
import { getEggDataService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function getEggData(input: { status?: 'INCUBATING' | 'HATCHED' | 'FAILED' } = {}) {
  try {
    const validated = getEggDataSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await getEggDataService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('getEggData error:', error)
    return { success: false as const, error: '알 데이터 조회 실패' }
  }
}
