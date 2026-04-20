'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { getSalesForPdf } from '@/services/sales-service'
import type { SearchFilters } from '@/app/(client)/(desktop)/sales/_components/sales-search-filters'
import type { SalesAnimalForPdf } from '@/services/sales-service'

export async function getSalesForPdfAction(filters: SearchFilters) {
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

    const animals = await getSalesForPdf({
      tenantId: user.tenantId,
      userId: user.id,
      ...filters,
    })

    return {
      success: true,
      data: animals as SalesAnimalForPdf[],
    }
  } catch (error) {
    console.error('Failed to get sales for PDF:', error)
    return {
      success: false,
      error: '판매 데이터 조회에 실패했습니다',
    }
  }
}
