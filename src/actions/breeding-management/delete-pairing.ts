'use server'

import { deletePairingSchema, type DeletePairingInput } from './schemas'
import { deletePairingService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function deletePairing(input: DeletePairingInput) {
  try {
    const validated = deletePairingSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await deletePairingService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('deletePairing error:', error)
    return { success: false as const, error: '페어링 삭제 실패' }
  }
}
