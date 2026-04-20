'use server'

import { updateCustomerSchema, type UpdateCustomerInput } from './schemas'
import { updateCustomerService } from '@/services/customer-service'
import { getCurrentUserService } from '@/services/auth-service'

export type UpdateCustomerResponse =
  | { success: true }
  | { success: false; error: string }

export async function updateCustomer(
  input: UpdateCustomerInput
): Promise<UpdateCustomerResponse> {
  try {
    const validated = updateCustomerSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    const result = await updateCustomerService(validated, tenantId)

    return result
  } catch (error) {
    console.error('updateCustomer error:', error)
    return { success: false, error: 'Failed to update customer' }
  }
}
