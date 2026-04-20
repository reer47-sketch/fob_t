'use server'

import { getCurrentUserService } from '@/services/auth-service'
import {
  getFeedingCalendarService,
  type FeedingCalendarData,
} from '@/services/feeding-calendar-service'
import { FoodType } from '@prisma/client'

export interface GetFeedingCalendarParams {
  year: number
  month: number // 1~12
  page?: number
  pageSize?: number
  speciesId?: string
  uniqueId?: string
  foodType?: FoodType
}

export type GetFeedingCalendarResult =
  | { success: true; data: FeedingCalendarData }
  | { success: false; error: string }

/**
 * 개체별 피딩 캘린더 데이터 조회 Server Action
 */
export async function getFeedingCalendar(
  params: GetFeedingCalendarParams
): Promise<GetFeedingCalendarResult> {
  try {
    // 1. 인증 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: '인증이 필요합니다' }
    }

    const user = userResult.data

    // 2. 테넌트 확인
    if (!user.tenantId) {
      return { success: false, error: '테넌트 정보가 없습니다' }
    }

    // 3. 파라미터 검증
    const { year, month, page, pageSize, speciesId, uniqueId, foodType } = params

    if (!year || !month || month < 1 || month > 12) {
      return { success: false, error: '유효하지 않은 날짜입니다' }
    }

    // 4. 서비스 호출
    const result = await getFeedingCalendarService({
      tenantId: user.tenantId,
      year,
      month,
      page,
      pageSize,
      speciesId,
      uniqueId,
      foodType,
    })

    return result
  } catch (error) {
    console.error('getFeedingCalendar error:', error)
    return {
      success: false,
      error: '캘린더 데이터 조회 중 오류가 발생했습니다',
    }
  }
}
