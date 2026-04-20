'use server'

import { createBlogService } from '@/services/blog-service'
import { getCurrentUserService } from '@/services/auth-service'
import { CreateBlogInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function createBlog(input: CreateBlogInput) {
  try {
    const session = await getCurrentUserService()
    
    if (!session.success || !session.data) {
      return { success: false, error: 'Unauthorized' }
    }

    // Admin check logic can be added here if needed, 
    // but the layout already protects admin routes.
    // However, checking tenantId is crucial.
    const tenantId = session.data.tenantId
    if (!tenantId) {
        return { success: false, error: 'Tenant not found' }
    }

    const result = await createBlogService(input, tenantId)

    if (result.success) {
      revalidatePath('/admin/blogs')
      revalidatePath('/blog') // Public blog list
    }

    return result
  } catch (error) {
    console.error('createBlog action error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create blog' }
  }
}
