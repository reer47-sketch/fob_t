'use server'

import { updatePairingStatusSchema, type UpdatePairingStatusInput } from './schemas'
import { updatePairingStatusService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updatePairingStatus(input: UpdatePairingStatusInput) {
  try {
    const validated = updatePairingStatusSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updatePairingStatusService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updatePairingStatus error:', error)
    return { success: false as const, error: '페어링 상태 변경 실패' }
  }
}
