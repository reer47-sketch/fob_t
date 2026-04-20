'use server'

import { updateAnimalAppearanceInfoSchema } from './schemas'
import type { UpdateAnimalAppearanceInfoInput } from './schemas'
import { getCurrentUserService } from '@/services/auth-service'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAnimalAppearanceInfo(input: UpdateAnimalAppearanceInfoInput) {
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
    const validatedData = updateAnimalAppearanceInfoSchema.parse(input)

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
      // 1. AnimalDetail 업데이트 (또는 생성)
      const detailData = {
        currentSize: validatedData.currentSize ?? null,
        tailStatus: validatedData.tailStatus ?? null,
        patternType: validatedData.patternType ?? null,
        distinctiveMarks: validatedData.distinctiveMarks ?? null,
        quality: validatedData.quality ?? null,
        isMating: validatedData.isMating,
        healthStatus: validatedData.healthStatus ?? null,
        specialNeeds: validatedData.specialNeeds ?? null,
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
          },
        })
      }

      // 2. 기존 콤보모프(MORPH, isPrimary=false), 형질(TRAIT), 색감(COLOR) 코드 ID 조회 후 삭제
      const existingCodes = await tx.animalCode.findMany({
        where: {
          animalId: validatedData.id,
        },
        include: {
          code: {
            select: {
              category: true,
            },
          },
        },
      })

      const codeIdsToDelete = existingCodes
        .filter((ac) =>
          ac.code.category === 'TRAIT' ||
          ac.code.category === 'COLOR' ||
          (ac.code.category === 'MORPH' && !ac.isPrimary) // 콤보모프만 삭제 (대표모프 제외)
        )
        .map((ac) => ac.id)

      if (codeIdsToDelete.length > 0) {
        await tx.animalCode.deleteMany({
          where: {
            id: {
              in: codeIdsToDelete,
            },
          },
        })
      }

      // 3. 새로운 콤보모프 추가 (복수 선택 가능, isPrimary=false)
      if (validatedData.comboMorphIds && validatedData.comboMorphIds.length > 0) {
        await tx.animalCode.createMany({
          data: validatedData.comboMorphIds.map(morphId => ({
            animalId: validatedData.id,
            codeId: morphId,
            isPrimary: false,
          })),
        })
      }

      // 4. 새로운 형질 코드 추가 (복수 선택 가능, isPrimary=false)
      if (validatedData.traitIds && validatedData.traitIds.length > 0) {
        await tx.animalCode.createMany({
          data: validatedData.traitIds.map(traitId => ({
            animalId: validatedData.id,
            codeId: traitId,
            isPrimary: false,
          })),
        })
      }

      // 5. 새로운 색감 코드 추가 (복수 선택 가능, isPrimary=false)
      if (validatedData.colorIds && validatedData.colorIds.length > 0) {
        await tx.animalCode.createMany({
          data: validatedData.colorIds.map(colorId => ({
            animalId: validatedData.id,
            codeId: colorId,
            isPrimary: false,
          })),
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
    console.error('Error updating animal appearance info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '개체 외관 정보 수정에 실패했습니다.',
    }
  }
}
