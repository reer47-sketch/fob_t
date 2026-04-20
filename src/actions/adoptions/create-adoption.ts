'use server'

import { createAdoptionSchema, type CreateAdoptionInput } from './schemas'
import { createAdoptionService } from '@/services/adoption-service'
import { getCurrentUserService } from '@/services/auth-service'

export type CreateAdoptionResponse =
  | { success: true; data: { count: number } }
  | { success: false; error: string }

export async function createAdoption(
  input: CreateAdoptionInput
): Promise<CreateAdoptionResponse> {
  try {
    const validated = createAdoptionSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    return await createAdoptionService(validated, tenantId)
  } catch (error) {
    console.error('createAdoption error:', error)
    return { success: false, error: 'Failed to create adoption' }
  }
}
