'use server'

import { updateAdoptionSchema, type UpdateAdoptionInput } from './schemas'
import { updateAdoptionService } from '@/services/adoption-service'
import { getCurrentUserService } from '@/services/auth-service'

export type UpdateAdoptionResponse =
  | { success: true }
  | { success: false; error: string }

export async function updateAdoption(
  input: UpdateAdoptionInput
): Promise<UpdateAdoptionResponse> {
  try {
    const validated = updateAdoptionSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    return await updateAdoptionService(validated, tenantId)
  } catch (error) {
    console.error('updateAdoption error:', error)
    return { success: false, error: 'Failed to update adoption' }
  }
}
