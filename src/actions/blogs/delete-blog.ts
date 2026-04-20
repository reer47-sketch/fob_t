'use server'

import { deleteBlogService } from '@/services/blog-service'
import { getCurrentUserService } from '@/services/auth-service'
import { revalidatePath } from 'next/cache'

export async function deleteBlog(id: string) {
  try {
    const session = await getCurrentUserService()
    
    if (!session.success || !session.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.data.tenantId
    if (!tenantId) {
        return { success: false, error: 'Tenant not found' }
    }

    const result = await deleteBlogService(id, tenantId)

    if (result.success) {
      revalidatePath('/admin/blogs')
      revalidatePath('/blog')
    }

    return result
  } catch (error) {
    console.error('deleteBlog action error:', error)
    return { success: false, error: 'Failed to delete blog' }
  }
}
