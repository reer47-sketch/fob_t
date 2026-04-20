'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { updateAdoptionReportService } from '@/services/adoption-service'

export async function updateAdoptionReport(adoptionId: string, isReported: boolean) {
  const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

  return updateAdoptionReportService(adoptionId, isReported, tenantId)
}
