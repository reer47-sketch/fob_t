'use server'

import { getBlogsService, GetBlogsInput } from '@/services/blog-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function getBlogs(input: GetBlogsInput) {
  try {
    const session = await getCurrentUserService()
    const isMember = session.success && !!session.data

    return await getBlogsService(input, undefined, isMember)
  } catch (error) {
    console.error('getBlogs action error:', error)
    return { success: false as const, error: 'Failed to fetch blogs' }
  }
}
