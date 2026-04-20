'use server'

import { deleteAdoptionService } from '@/services/adoption-service'
import { getCurrentUserService } from '@/services/auth-service'

export type DeleteAdoptionResponse =
  | { success: true }
  | { success: false; error: string }

export async function deleteAdoption(
  adoptionId: string
): Promise<DeleteAdoptionResponse> {
  try {
    if (!adoptionId) {
      return { success: false, error: 'Adoption ID is required' }
    }

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    return await deleteAdoptionService(adoptionId, tenantId)
  } catch (error) {
    console.error('deleteAdoption error:', error)
    return { success: false, error: 'Failed to delete adoption' }
  }
}
