'use server'

import { createCustomerSchema, type CreateCustomerInput } from './schemas'
import { createCustomerService } from '@/services/customer-service'
import { getCurrentUserService } from '@/services/auth-service'

export type CreateCustomerResponse =
  | { success: true; data: { id: string } }
  | { success: false; error: string }

export async function createCustomer(
  input: CreateCustomerInput
): Promise<CreateCustomerResponse> {
  try {
    const validated = createCustomerSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    const result = await createCustomerService(validated, tenantId)

    return result
  } catch (error) {
    console.error('createCustomer error:', error)
    return { success: false, error: 'Failed to create customer' }
  }
}
