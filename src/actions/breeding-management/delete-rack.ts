'use server'

import { deleteRackSchema, type DeleteRackInput } from './schemas'
import { deleteRackService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function deleteRack(input: DeleteRackInput) {
  try {
    const validated = deleteRackSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await deleteRackService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('deleteRack error:', error)
    return { success: false as const, error: '렉사 삭제 실패' }
  }
}
