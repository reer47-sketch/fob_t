'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import type { LabelSettings } from '@/app/(client)/(desktop)/animals/_components/label-renderer'

export async function getTemplate() {
  try {
    const session = await getCurrentUserService()
    if (!session?.success || !session.data) {
      return { success: false, error: '인증이 필요합니다' }
    }

    const tenantId = session.data.tenantId
    if (!tenantId) {
      return { success: false, error: '테넌트 정보가 없습니다' }
    }

    const template = await prisma.labelTemplate.findFirst({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    })

    if (!template) {
      return { success: true, data: null }
    }

    return { success: true, data: template.content as unknown as LabelSettings }
  } catch (error) {
    console.error('getTemplate error:', error)
    return { success: false, error: '템플릿 조회 중 오류가 발생했습니다' }
  }
}
