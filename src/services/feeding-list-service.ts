import { prisma } from '@/lib/prisma'
import { Prisma, FoodType } from '@prisma/client'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface FeedingListItem {
  id: number
  animalId: string
  foodType: FoodType
  superfood: boolean
  feedingDate: Date
  quantity: string | null
  memo: string | null
  createdAt: Date
  animal: {
    id: string
    uniqueId: string
    name: string | null
  }
}

export interface GetFeedingsParams {
  tenantId: string
  page?: number
  pageSize?: number
  feedingDateFrom?: string
  feedingDateTo?: string
  foodType?: FoodType
  animalUniqueId?: string
}

export interface GetFeedingsResult {
  feedings: FeedingListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 피딩 목록 조회 서비스
 */
export async function getFeedingsService(
  params: GetFeedingsParams
): Promise<ServiceResponse<GetFeedingsResult>> {
  try {
    const {
      tenantId,
      page = 1,
      pageSize = 20,
      feedingDateFrom,
      feedingDateTo,
      foodType,
      animalUniqueId,
    } = params

    // WHERE 조건 구성
    const where: Prisma.FeedingWhereInput = {
      animal: {
        tenantId,
        isDel: false,
      },
    }

    // 피딩 날짜 필터
    if (feedingDateFrom || feedingDateTo) {
      where.feedingDate = {}
      if (feedingDateFrom) {
        // 한국 시간 기준 해당 날짜의 00:00:00
        const startDate = new Date(feedingDateFrom + 'T00:00:00+09:00')
        where.feedingDate.gte = startDate
      }
      if (feedingDateTo) {
        // 한국 시간 기준 해당 날짜의 23:59:59.999
        const endDate = new Date(feedingDateTo + 'T23:59:59.999+09:00')
        where.feedingDate.lte = endDate
      }
    }

    // 먹이 종류 필터
    if (foodType) {
      where.foodType = foodType
    }

    // 고유개체ID 필터
    if (animalUniqueId) {
      where.animal = {
        ...where.animal as Prisma.AnimalWhereInput,
        uniqueId: {
          contains: animalUniqueId,
          mode: 'insensitive',
        },
      }
    }

    // 전체 개수 조회
    const total = await prisma.feeding.count({ where })

    // 페이지네이션 계산
    const totalPages = Math.ceil(total / pageSize)
    const skip = (page - 1) * pageSize

    // 피딩 목록 조회
    const feedings = await prisma.feeding.findMany({
      where,
      include: {
        animal: {
          select: {
            id: true,
            uniqueId: true,
            name: true,
          },
        },
      },
      orderBy: {
        feedingDate: 'desc',
      },
      skip,
      take: pageSize,
    })

    return {
      success: true,
      data: {
        feedings,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('getFeedingsService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to get feedings' }
  }
}
