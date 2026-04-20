'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { updateReportedStatus } from '@/services/sales-service'

export async function updateReportedStatusAction(animalIds: string[]) {
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

    // 신고 상태 업데이트
    const updatedCount = await updateReportedStatus({
      tenantId: user.tenantId,
      animalIds,
    })

    return {
      success: true,
      data: { updatedCount },
    }
  } catch (error) {
    console.error('Failed to update reported status:', error)
    return {
      success: false,
      error: '신고 상태 업데이트에 실패했습니다',
    }
  }
}
