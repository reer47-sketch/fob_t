'use server'

import { createRackSchema, type CreateRackInput } from './schemas'
import { createRackService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function createRack(input: CreateRackInput) {
  try {
    const validated = createRackSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await createRackService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('createRack error:', error)
    return { success: false as const, error: '렉사 생성 실패' }
  }
}
