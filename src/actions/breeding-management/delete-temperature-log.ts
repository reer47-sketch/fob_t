'use server'

import { deleteTemperatureLogSchema, type DeleteTemperatureLogInput } from './schemas'
import { deleteTemperatureLogService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function deleteTemperatureLog(input: DeleteTemperatureLogInput) {
  try {
    const validated = deleteTemperatureLogSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await deleteTemperatureLogService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('deleteTemperatureLog error:', error)
    return { success: false as const, error: '온도 기록 삭제 실패' }
  }
}
