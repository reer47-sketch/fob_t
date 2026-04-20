'use server'

import { createEggsSchema, type CreateEggsInput } from './schemas'
import { createEggsService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function createEggs(input: CreateEggsInput) {
  try {
    const validated = createEggsSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await createEggsService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('createEggs error:', error)
    return { success: false as const, error: '산란 등록 실패' }
  }
}
