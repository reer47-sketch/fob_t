'use server'

import { unassignCellSchema, type UnassignCellInput } from './schemas'
import { unassignCellService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function unassignCell(input: UnassignCellInput) {
  try {
    const validated = unassignCellSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await unassignCellService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('unassignCell error:', error)
    return { success: false as const, error: '배정 해제 실패' }
  }
}
