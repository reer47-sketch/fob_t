'use server'

import { getCustomersSchema, type GetCustomersInput } from './schemas'
import { getCustomersService, type CustomerListResult } from '@/services/customer-service'
import { getCurrentUserService } from '@/services/auth-service'

export type GetCustomersResponse =
  | { success: true; data: CustomerListResult }
  | { success: false; error: string }

/**
 * 고객 목록 조회 Server Action
 */
export async function getCustomers(
  input: GetCustomersInput
): Promise<GetCustomersResponse> {
  try {
    // 1. Validation
    const validated = getCustomersSchema.parse(input)

    // 2. Authorization - 현재 사용자 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    // BREEDER는 자신의 tenant만 조회 가능
    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    // 3. Business Logic (Service로 위임)
    const result = await getCustomersService(validated, tenantId)

    return result
  } catch (error) {
    console.error('getCustomers error:', error)
    return { success: false, error: 'Failed to fetch customers' }
  }
}
