'use server'

import { getAvailableAnimalsService, type AvailableAnimal } from '@/services/adoption-service'
import { getCurrentUserService } from '@/services/auth-service'

export type GetAvailableAnimalsResponse =
  | { success: true; data: AvailableAnimal[] }
  | { success: false; error: string }

export async function getAvailableAnimals(
  search?: string
): Promise<GetAvailableAnimalsResponse> {
  try {
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    return await getAvailableAnimalsService(tenantId, search)
  } catch (error) {
    console.error('getAvailableAnimals error:', error)
    return { success: false, error: 'Failed to fetch available animals' }
  }
}
