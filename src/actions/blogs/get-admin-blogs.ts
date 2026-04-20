'use server'

import { getAdminBlogsService } from '@/services/blog-service'
import { getCurrentUserService } from '@/services/auth-service'
import { GetBlogsInput } from './schemas'

export async function getAdminBlogs(input: GetBlogsInput) {
  try {
    const session = await getCurrentUserService()

    if (!session.success || !session.data) {
      return { success: false as const, error: 'Unauthorized' }
    }

    const tenantId = session.data.tenantId
    if (!tenantId) {
        return { success: false as const, error: 'Tenant not found' }
    }

    return await getAdminBlogsService(input, tenantId)
  } catch (error) {
    console.error('getAdminBlogs action error:', error)
    return { success: false as const, error: 'Failed to fetch blogs' }
  }
}
