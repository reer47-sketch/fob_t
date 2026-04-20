'use server'

import { deleteCustomerService } from '@/services/customer-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function deleteCustomer(customerId: string) {
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

    return deleteCustomerService(customerId, tenantId)
  } catch (error) {
    console.error('deleteCustomer error:', error)
    return { success: false, error: 'Failed to delete customer' }
  }
}
