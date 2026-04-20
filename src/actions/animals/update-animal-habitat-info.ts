'use server'

import { updateAnimalHabitatInfoSchema } from './schemas'
import type { UpdateAnimalHabitatInfoInput } from './schemas'
import { getCurrentUserService } from '@/services/auth-service'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAnimalHabitatInfo(input: UpdateAnimalHabitatInfoInput) {
  try {
    // 인증 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return { success: false, error: '테넌트 정보가 없습니다.' }
    }

    // 입력값 검증
    const validatedData = updateAnimalHabitatInfoSchema.parse(input)

    // 개체 소유권 확인 (같은 테넌트인지 확인)
    const animal = await prisma.animal.findUnique({
      where: { id: validatedData.id },
      select: {
        tenantId: true,
        detail: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!animal) {
      return { success: false, error: '개체를 찾을 수 없습니다.' }
    }

    if (animal.tenantId !== tenantId) {
      return { success: false, error: '권한이 없습니다.' }
    }

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // AnimalDetail 업데이트 (또는 생성)
      const detailData = {
        cageInfo: validatedData.cageInfo ?? null,
        flooringInfo: validatedData.flooringInfo ?? null,
        habitatNotes: validatedData.habitatNotes ?? null,
      }

      if (animal.detail?.id) {
        // 기존 detail 업데이트
        await tx.animalDetail.update({
          where: { id: animal.detail.id },
          data: detailData,
        })
      } else {
        // detail이 없으면 생성 (animalId 포함)
        await tx.animalDetail.create({
          data: {
            ...detailData,
            animalId: validatedData.id,
            isMating: false, // 기본값 설정
          },
        })
      }
    })

    // 캐시 갱신
    revalidatePath('/animals')
    revalidatePath(`/animals/${validatedData.id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error updating animal habitat info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '개체 서식지 정보 수정에 실패했습니다.',
    }
  }
}
