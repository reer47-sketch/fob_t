'use server'

import { getCurrentUserService } from '@/services/auth-service'
import {
  generateUniqueIdSchema,
  type GenerateUniqueIdInput,
} from './schemas'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

/**
 * 개체 고유ID 미리보기 생성
 * 형식: 샵코드(6자리) + 모프코드(변동) + 입양/해칭일(8자리 YYYYMMDD) + 순서(4자리)
 * 예: S00158NM202509180001
 */
export async function generateUniqueId(input: GenerateUniqueIdInput) {
  try {
    // 1. 입력 검증
    const validated = generateUniqueIdSchema.parse(input)

    // 2. 사용자 인증 및 테넌트 정보 가져오기
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: '인증이 필요합니다',
      }
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return {
        success: false,
        error: '테넌트 정보가 없습니다',
      }
    }

    // 3. 테넌트(샵) 정보 조회 - slug 가져오기
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    })

    if (!tenant || !tenant.slug) {
      return {
        success: false,
        error: '샵 slug 정보를 찾을 수 없습니다',
      }
    }

    // 4. 모프 코드 가져오기 (선택적)
    let morphCode = ''
    if (validated.morphId) {
      const morph = await prisma.code.findUnique({
        where: { id: validated.morphId },
        select: { code: true },
      })
      morphCode = morph?.code || ''
    }

    // 5. 입양/해칭일을 YYYYMMDD 형식으로 변환
    const dateStr = format(validated.acquisitionDate, 'yyyyMMdd')

    // 6. 같은 날짜의 개체 수 조회하여 다음 순서 번호 계산
    const datePrefix = `${tenant.slug}${morphCode}${dateStr}`
    const lastAnimal = await prisma.animal.findFirst({
      where: {
        tenantId,
        uniqueId: {
          startsWith: datePrefix,
        },
      },
      orderBy: {
        uniqueId: 'desc',
      },
      select: {
        uniqueId: true,
      },
    })

    let sequence = 1
    if (lastAnimal) {
      // uniqueId의 마지막 4자리에서 순서 번호 추출
      const lastSequence = lastAnimal.uniqueId.slice(-4)
      sequence = parseInt(lastSequence, 10) + 1
    }

    // 7. 순서를 4자리로 패딩
    const sequenceStr = String(sequence).padStart(4, '0')

    // 8. 최종 uniqueId 생성
    const uniqueId = `${datePrefix}${sequenceStr}`

    return {
      success: true,
      data: {
        uniqueId,
        slug: tenant.slug,
        morphCode,
        date: dateStr,
        sequence: sequenceStr,
      },
    }
  } catch (error) {
    console.error('generateUniqueId error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '고유ID 생성 중 오류가 발생했습니다',
    }
  }
}
