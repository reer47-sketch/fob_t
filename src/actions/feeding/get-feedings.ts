'use server'

import { getCurrentUser } from '@/actions/auth/get-current-user'
import { getFeedingsService, type GetFeedingsResult } from '@/services/feeding-list-service'
import { FoodType } from '@prisma/client'

export interface GetFeedingsParams {
  page?: number
  pageSize?: number
  feedingDateFrom?: string
  feedingDateTo?: string
  foodType?: FoodType
  animalUniqueId?: string
}

export type GetFeedingsActionResult =
  | { success: true; data: GetFeedingsResult }
  | { success: false; error: string }

export async function getFeedings(
  params: GetFeedingsParams
): Promise<GetFeedingsActionResult> {
  try {
    // 현재 사용자 확인
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: '인증이 필요합니다' }
    }

    const user = userResult.data

    // 테넌트 확인
    if (!user.tenantId) {
      return { success: false, error: '테넌트 정보가 없습니다' }
    }

    // 서비스 호출
    const result = await getFeedingsService({
      tenantId: user.tenantId,
      ...params,
    })

    return result
  } catch (error) {
    console.error('getFeedings action error:', error)
    return { success: false, error: '피딩 목록을 불러오는데 실패했습니다' }
  }
}
