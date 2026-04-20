'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { revalidatePath } from 'next/cache'

interface ReorderInput {
  orderedIds: string[]
}

export async function reorderBanners(input: ReorderInput) {
  try {
    const session = await getCurrentUserService()

    if (!session.success || !session.data) {
      return { success: false as const, error: 'Unauthorized' }
    }

    if (session.data.role !== 'ADMIN') {
      return { success: false as const, error: 'Forbidden' }
    }

    const { orderedIds } = input

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.banner.update({
          where: { id },
          data: { displayOrder: index + 1 },
        })
      )
    )

    revalidatePath('/admin/banners')
    revalidatePath('/')

    return { success: true as const }
  } catch (error) {
    console.error('reorderBanners action error:', error)
    return { success: false as const, error: 'Failed to reorder banners' }
  }
}
