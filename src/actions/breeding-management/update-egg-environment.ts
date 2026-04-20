'use server'

import { updateEggEnvironmentSchema, type UpdateEggEnvironmentInput } from './schemas'
import { updateEggEnvironmentService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updateEggEnvironment(input: UpdateEggEnvironmentInput) {
  try {
    const validated = updateEggEnvironmentSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updateEggEnvironmentService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updateEggEnvironment error:', error)
    return { success: false as const, error: '환경 수정 실패' }
  }
}
