'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import type { LabelSettings } from '@/app/(client)/(desktop)/animals/_components/label-renderer'

export async function createTemplate(settings: LabelSettings) {
  try {
    const session = await getCurrentUserService()
    if (!session?.success || !session.data) {
      return { success: false, error: '인증이 필요합니다' }
    }

    const tenantId = session.data.tenantId
    if (!tenantId) {
      return { success: false, error: '테넌트 정보가 없습니다' }
    }

    // 기존 템플릿 조회 (최근 1개)
    const existingTemplate = await prisma.labelTemplate.findFirst({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    })

    if (existingTemplate) {
      // 업데이트
      await prisma.labelTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          content: settings as any, // Json 타입으로 저장
        },
      })
    } else {
      // 생성
      await prisma.labelTemplate.create({
        data: {
          tenantId,
          content: settings as any,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('createTemplate error:', error)
    return { success: false, error: '템플릿 저장 중 오류가 발생했습니다' }
  }
}
