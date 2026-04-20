'use server'

import {
  getCustomerAdoptionsService,
  type CustomerAdoptionItem,
} from '@/services/adoption-service'
import { getCurrentUserService } from '@/services/auth-service'

export type GetCustomerAdoptionsResponse =
  | { success: true; data: CustomerAdoptionItem[] }
  | { success: false; error: string }

export async function getCustomerAdoptions(
  customerId: string
): Promise<GetCustomerAdoptionsResponse> {
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

    return await getCustomerAdoptionsService(customerId, tenantId)
  } catch (error) {
    console.error('getCustomerAdoptions error:', error)
    return { success: false, error: 'Failed to fetch customer adoptions' }
  }
}
