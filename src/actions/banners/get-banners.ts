'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { GetBannersInput } from './schemas'

export async function getBanners(input: GetBannersInput = { page: 1, pageSize: 10 }) {
  try {
    const session = await getCurrentUserService()

    if (!session.success || !session.data) {
      return { success: false as const, error: 'Unauthorized' }
    }

    if (session.data.role !== 'ADMIN') {
      return { success: false as const, error: 'Forbidden' }
    }

    const { page, pageSize, isActive } = input
    const skip = (page - 1) * pageSize

    const where = isActive !== undefined ? { isActive } : {}

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        orderBy: { displayOrder: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.banner.count({ where }),
    ])

    return {
      success: true as const,
      data: {
        banners,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('getBanners action error:', error)
    return { success: false as const, error: 'Failed to fetch banners' }
  }
}
