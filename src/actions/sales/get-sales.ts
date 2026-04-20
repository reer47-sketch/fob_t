'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { getSales, type GetSalesParams, type GetSalesResult } from '@/services/sales-service'
import type { Gender } from '@prisma/client'

export interface GetSalesInput {
  speciesId?: string
  morphIds?: string[]
  traitIds?: string[]
  gender?: Gender
  minPrice?: number
  maxPrice?: number
  isReported?: boolean
  yearMonth?: string // YYYY-MM 형식
  uniqueId?: string
  page?: number
  pageSize?: number
}

export async function getSalesAction(
  input: GetSalesInput
): Promise<{ success: true; data: GetSalesResult } | { success: false; error: string }> {
  try {
    // 현재 사용자 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (!user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const params: GetSalesParams = {
      tenantId: user.tenantId,
      ...input,
    }

    const result = await getSales(params)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Failed to get sales:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sales',
    }
  }
}
