'use server'

import { assignCellSchema, type AssignCellInput } from './schemas'
import { assignCellService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function assignCell(input: AssignCellInput) {
  try {
    const validated = assignCellSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await assignCellService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('assignCell error:', error)
    return { success: false as const, error: '개체 배정 실패' }
  }
}
