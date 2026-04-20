import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'
import { getMonthRange, getKSTDay, getDaysInMonth } from '@/lib/date'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface FeedingCalendarAnimal {
  id: string
  name: string | null
  uniqueId: string
}

export interface FeedingCalendarData {
  animals: FeedingCalendarAnimal[]
  feedingsByAnimalAndDay: Record<string, Record<number, FoodType>>
  superfoodsByAnimalAndDay: Record<string, Record<number, boolean>>
  daysInMonth: number
  year: number
  month: number
  totalCount: number
  currentPage: number
  totalPages: number
}

/**
 * 개체별 피딩 캘린더 데이터 조회 서비스
 */
export async function getFeedingCalendarService(params: {
  tenantId: string
  year: number
  month: number
  page?: number
  pageSize?: number
  speciesId?: string
  uniqueId?: string
  foodType?: FoodType
}): Promise<ServiceResponse<FeedingCalendarData>> {
  try {
    const {
      tenantId,
      year,
      month,
      page = 1,
      pageSize = 20,
      speciesId,
      uniqueId,
      foodType,
    } = params

    // 1. 먹이 종류 필터가 있는 경우, 해당 먹이를 먹어본 개체 ID 목록을 먼저 조회
    let animalIdsWithFoodType: string[] | undefined

    if (foodType) {
      const animalsWithFood = await prisma.feeding.findMany({
        where: {
          foodType,
          animal: {
            tenantId,
            isDel: false,
          },
        },
        select: {
          animalId: true,
        },
        distinct: ['animalId'],
      })

      animalIdsWithFoodType = animalsWithFood.map((f) => f.animalId)

      // 해당 먹이를 먹은 개체가 없으면 빈 결과 반환
      if (animalIdsWithFoodType.length === 0) {
        return {
          success: true,
          data: {
            animals: [],
            feedingsByAnimalAndDay: {},
            superfoodsByAnimalAndDay: {},
            daysInMonth: getDaysInMonth(year, month),
            year,
            month,
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
          },
        }
      }
    }

    // 2. 필터 조건 구성
    const where: any = {
      tenantId,
      isDel: false,
    }

    if (speciesId) {
      where.speciesId = speciesId
    }

    if (uniqueId) {
      where.OR = [
        { uniqueId: { contains: uniqueId, mode: 'insensitive' } },
        { name: { contains: uniqueId, mode: 'insensitive' } },
      ]
    }

    // 먹이 종류로 필터링된 개체 ID 목록 적용
    if (animalIdsWithFoodType) {
      where.id = {
        in: animalIdsWithFoodType,
      }
    }

    // 3. 전체 개체 수 조회
    const totalCount = await prisma.animal.count({ where })

    // 4. 페이지네이션 계산
    const totalPages = Math.ceil(totalCount / pageSize)
    const skip = (page - 1) * pageSize

    // 5. 해당 테넌트의 개체 조회 (페이지네이션 적용)
    const animals = await prisma.animal.findMany({
      where,
      select: {
        id: true,
        name: true,
        uniqueId: true,
      },
      orderBy: {
        acquisitionDate: 'desc', // 등록일 최신순
      },
      skip,
      take: pageSize,
    })

    // 6. 해당 월의 피딩 데이터 조회 (현재 페이지 개체들만)
    const { start: startDate, end: endDate } = getMonthRange(year, month)

    const animalIds = animals.map((a) => a.id)

    const feedings = await prisma.feeding.findMany({
      where: {
        animalId: { in: animalIds },
        animal: {
          tenantId,
          isDel: false,
        },
        feedingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        animalId: true,
        foodType: true,
        superfood: true,
        feedingDate: true,
      },
      orderBy: {
        feedingDate: 'asc',
      },
    })

    // 7. 개체별-날짜별 그룹핑 (하루 첫 번째 피딩만)
    const feedingMap = new Map<string, Map<number, FoodType>>()
    const superfoodMap = new Map<string, Map<number, boolean>>()

    for (const feeding of feedings) {
      const day = getKSTDay(feeding.feedingDate)

      if (!feedingMap.has(feeding.animalId)) {
        feedingMap.set(feeding.animalId, new Map())
        superfoodMap.set(feeding.animalId, new Map())
      }

      const animalFeedings = feedingMap.get(feeding.animalId)!
      const animalSuperfoods = superfoodMap.get(feeding.animalId)!

      // 하루에 여러 피딩이 있어도 첫 번째만 저장 (덮어쓰지 않음)
      if (!animalFeedings.has(day)) {
        animalFeedings.set(day, feeding.foodType)
        animalSuperfoods.set(day, feeding.superfood)
      }
    }

    // 8. Map을 Record로 변환 (JSON 직렬화 가능)
    const feedingsByAnimalAndDay: Record<string, Record<number, FoodType>> = {}
    const superfoodsByAnimalAndDay: Record<string, Record<number, boolean>> = {}

    for (const [animalId, dayMap] of feedingMap.entries()) {
      feedingsByAnimalAndDay[animalId] = {}
      for (const [day, foodType] of dayMap.entries()) {
        feedingsByAnimalAndDay[animalId][day] = foodType
      }
    }

    for (const [animalId, dayMap] of superfoodMap.entries()) {
      superfoodsByAnimalAndDay[animalId] = {}
      for (const [day, isSuperfood] of dayMap.entries()) {
        superfoodsByAnimalAndDay[animalId][day] = isSuperfood
      }
    }

    // 9. 해당 월의 일수 계산
    const daysInMonth = getDaysInMonth(year, month)

    return {
      success: true,
      data: {
        animals,
        feedingsByAnimalAndDay,
        superfoodsByAnimalAndDay,
        daysInMonth,
        year,
        month,
        totalCount,
        currentPage: page,
        totalPages,
      },
    }
  } catch (error) {
    console.error('getFeedingCalendarService error:', error)
    return {
      success: false,
      error: 'Failed to fetch feeding calendar data',
    }
  }
}
