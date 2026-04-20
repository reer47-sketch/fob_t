'use server'

import { getBlogStatsService } from '@/services/blog-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function getBlogStats() {
  try {
    const session = await getCurrentUserService()

    if (!session.success || !session.data) {
      return { success: false as const, error: 'Unauthorized' }
    }

    const tenantId = session.data.tenantId
    if (!tenantId) {
        return { success: false as const, error: 'Tenant not found' }
    }

    return await getBlogStatsService(tenantId)
  } catch (error) {
    console.error('getBlogStats action error:', error)
    return { success: false as const, error: 'Failed to fetch blog stats' }
  }
}
