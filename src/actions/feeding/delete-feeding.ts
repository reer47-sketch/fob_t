'use server'

import { getCurrentUser } from '@/actions/auth/get-current-user'
import { prisma } from '@/lib/prisma'

export type DeleteFeedingResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteFeeding(feedingId: number): Promise<DeleteFeedingResult> {
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

    // 피딩 조회 및 권한 확인
    const feeding = await prisma.feeding.findUnique({
      where: { id: feedingId },
      include: {
        animal: {
          select: { tenantId: true },
        },
      },
    })

    if (!feeding) {
      return { success: false, error: '피딩 기록을 찾을 수 없습니다' }
    }

    if (feeding.animal.tenantId !== user.tenantId) {
      return { success: false, error: '삭제 권한이 없습니다' }
    }

    // 삭제
    await prisma.feeding.delete({
      where: { id: feedingId },
    })

    return { success: true }
  } catch (error) {
    console.error('deleteFeeding action error:', error)
    return { success: false, error: '피딩 기록 삭제에 실패했습니다' }
  }
}
