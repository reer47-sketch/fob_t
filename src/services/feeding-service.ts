import { prisma } from '@/lib/prisma'
import { Prisma, Feeding } from '@prisma/client'
import type { CreateFeedingInput } from '@/actions/feeding/schemas'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * 피딩 일괄 생성 서비스
 * 여러 개체에 대해 동일한 피딩 정보를 저장
 */
export async function createFeedingsService(
  input: CreateFeedingInput,
  tenantId: string
): Promise<ServiceResponse<Feeding[]>> {
  try {
    const { animalIds, foodType, superfood, feedingDate, quantity, memo } = input

    // 1. 해당 개체들이 모두 해당 테넌트 소유인지 확인
    const animals = await prisma.animal.findMany({
      where: {
        id: { in: animalIds },
        tenantId,
        isDel: false,
      },
      select: { id: true },
    })

    if (animals.length !== animalIds.length) {
      return {
        success: false,
        error: '일부 개체를 찾을 수 없거나 권한이 없습니다',
      }
    }

    // 2. 트랜잭션으로 모든 피딩 레코드 생성
    const feedings = await prisma.$transaction(
      animalIds.map((animalId) =>
        prisma.feeding.create({
          data: {
            animalId,
            foodType,
            superfood,
            feedingDate,
            quantity,
            memo,
          },
        })
      )
    )

    return {
      success: true,
      data: feedings,
    }
  } catch (error) {
    console.error('createFeedingsService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to create feedings' }
  }
}

/**
 * 특정 개체의 가장 최근 피딩 정보 조회
 */
export async function getLatestFeedingService(
  animalId: string,
  tenantId: string
): Promise<ServiceResponse<Feeding | null>> {
  try {
    // 개체가 해당 테넌트 소유인지 확인
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        tenantId,
        isDel: false,
      },
      select: { id: true },
    })

    if (!animal) {
      return {
        success: false,
        error: '개체를 찾을 수 없거나 권한이 없습니다',
      }
    }

    // 가장 최근 피딩 정보 조회
    const latestFeeding = await prisma.feeding.findFirst({
      where: {
        animalId,
      },
      orderBy: {
        feedingDate: 'desc',
      },
    })

    return {
      success: true,
      data: latestFeeding,
    }
  } catch (error) {
    console.error('getLatestFeedingService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to get latest feeding' }
  }
}
