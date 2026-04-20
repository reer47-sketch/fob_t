'use server'

import { getLatestFeedingService } from '@/services/feeding-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function getLatestFeeding(animalId: string) {
  try {
    const userResult = await getCurrentUserService()

    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' } as const
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant information not found' } as const
    }

    const result = await getLatestFeedingService(animalId, tenantId)

    return result
  } catch (error) {
    console.error('getLatestFeeding action error:', error)
    return { success: false, error: 'Failed to get latest feeding' } as const
  }
}
