'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { revalidatePath } from 'next/cache'

export async function deleteBanner(id: string) {
  try {
    const session = await getCurrentUserService()

    if (!session.success || !session.data) {
      return { success: false as const, error: 'Unauthorized' }
    }

    if (session.data.role !== 'ADMIN') {
      return { success: false as const, error: 'Forbidden' }
    }

    await prisma.banner.delete({
      where: { id },
    })

    revalidatePath('/admin/banners')

    return { success: true as const }
  } catch (error) {
    console.error('deleteBanner action error:', error)
    return { success: false as const, error: 'Failed to delete banner' }
  }
}
