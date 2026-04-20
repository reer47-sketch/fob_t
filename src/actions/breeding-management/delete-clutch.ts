'use server'

import { deleteClutchSchema, type DeleteClutchInput } from './schemas'
import { deleteClutchService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function deleteClutch(input: DeleteClutchInput) {
  try {
    const validated = deleteClutchSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await deleteClutchService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('deleteClutch error:', error)
    return { success: false as const, error: '산란 삭제 실패' }
  }
}
