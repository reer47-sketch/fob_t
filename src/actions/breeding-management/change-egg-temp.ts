'use server'

import { changeEggTempSchema, type ChangeEggTempInput } from './schemas'
import { changeEggTempService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function changeEggTemp(input: ChangeEggTempInput) {
  try {
    const validated = changeEggTempSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await changeEggTempService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('changeEggTemp error:', error)
    return { success: false as const, error: '온도 변경 실패' }
  }
}
