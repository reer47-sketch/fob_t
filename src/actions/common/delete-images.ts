'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { deleteMultipleFromR2, getKeyFromUrl } from '@/lib/r2'

export async function deleteImages(imageUrls: string[]) {
  try {
    const session = await getCurrentUserService()
    
    if (!session.success || !session.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const keys = imageUrls.map(url => {
        try {
            return getKeyFromUrl(url)
        } catch (e) {
            return null
        }
    }).filter((k): k is string => !!k)

    if (keys.length > 0) {
        await deleteMultipleFromR2(keys)
    }

    return { success: true }
  } catch (error) {
    console.error('deleteImages action error:', error)
    return { success: false, error: 'Failed to delete images' }
  }
}
