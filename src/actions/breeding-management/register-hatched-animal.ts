'use server'

import { getEggRegisterDataSchema, type GetEggRegisterDataInput } from './schemas'
import { getEggRegisterDataService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function getEggRegisterData(input: GetEggRegisterDataInput) {
  try {
    const validated = getEggRegisterDataSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await getEggRegisterDataService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('getEggRegisterData error:', error)
    return { success: false as const, error: '알 데이터 조회 실패' }
  }
}
