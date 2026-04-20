'use server'

import { updateBlogService } from '@/services/blog-service'
import { getCurrentUserService } from '@/services/auth-service'
import { CreateBlogInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function updateBlog(id: string, input: CreateBlogInput) {
  try {
    const session = await getCurrentUserService()
    
    if (!session.success || !session.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.data.tenantId
    if (!tenantId) {
        return { success: false, error: 'Tenant not found' }
    }

    const result = await updateBlogService(id, input, tenantId)

    if (result.success) {
      revalidatePath('/admin/blogs')
      revalidatePath('/blog') // Public blog list
      revalidatePath(`/blog/${result.data.slug}`) // Public blog detail
    }

    return result
  } catch (error) {
    console.error('updateBlog action error:', error)
    return { success: false, error: 'Failed to update blog' }
  }
}
