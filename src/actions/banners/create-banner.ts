'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { CreateBannerInput, createBannerSchema } from './schemas'
import { revalidatePath } from 'next/cache'

export async function createBanner(input: CreateBannerInput) {
  try {
    const session = await getCurrentUserService()

    if (!session.success || !session.data) {
      return { success: false as const, error: 'Unauthorized' }
    }

    if (session.data.role !== 'ADMIN') {
      return { success: false as const, error: 'Forbidden' }
    }

    const validated = createBannerSchema.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const data = validated.data

    const banner = await prisma.banner.create({
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
    console.error('createBanner action error:', error)
    return { success: false as const, error: 'Failed to create banner' }
  }
}
