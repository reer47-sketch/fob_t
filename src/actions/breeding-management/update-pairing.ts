'use server'

import { updatePairingSchema, type UpdatePairingInput } from './schemas'
import { updatePairingService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function updatePairing(input: UpdatePairingInput) {
  try {
    const validated = updatePairingSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await updatePairingService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('updatePairing error:', error)
    return { success: false as const, error: '페어링 수정 실패' }
  }
}
