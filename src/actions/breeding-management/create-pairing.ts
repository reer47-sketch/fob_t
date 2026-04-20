'use server'

import { createPairingSchema, type CreatePairingInput } from './schemas'
import { createPairingService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function createPairing(input: CreatePairingInput) {
  try {
    const validated = createPairingSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await createPairingService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('createPairing error:', error)
    return { success: false as const, error: '페어링 생성 실패' }
  }
}
