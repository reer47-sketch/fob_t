'use server'

import { prisma } from '@/lib/prisma'

export async function getPublicBanners() {
  try {
    const now = new Date()

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
      },
    })

    return {
      success: true as const,
      data: banners,
    }
  } catch (error) {
    console.error('getPublicBanners action error:', error)
    return { success: false as const, error: 'Failed to fetch banners' }
  }
}
