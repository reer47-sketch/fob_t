'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { UpdateBannerInput, updateBannerSchema } from './schemas'
import { revalidatePath } from 'next/cache'

export async function updateBanner(input: UpdateBannerInput) {
  try {
    const session = await getCurrentUserService()

    if (!session.success || !session.data) {
      return { success: false as const, error: 'Unauthorized' }
    }

    if (session.data.role !== 'ADMIN') {
      return { success: false as const, error: 'Forbidden' }
    }

    const validated = updateBannerSchema.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const { id, ...data } = validated.data

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl ?? null,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
      },
    })

    revalidatePath('/admin/banners')

    return { success: true as const, data: banner }
  } catch (error) {
    console.error('updateBanner action error:', error)
    return { success: false as const, error: 'Failed to update banner' }
  }
}
