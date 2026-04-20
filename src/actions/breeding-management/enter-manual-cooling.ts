'use server'

import { enterManualCoolingSchema, type EnterManualCoolingInput } from './schemas'
import { enterManualCoolingService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function enterManualCooling(input: EnterManualCoolingInput) {
  try {
    const validated = enterManualCoolingSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await enterManualCoolingService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('enterManualCooling error:', error)
    return { success: false as const, error: '쿨링 전환 실패' }
  }
}
