'use server'

import { updateAnimalBasicInfoSchema } from './schemas'
import type { UpdateAnimalBasicInfoInput } from './schemas'
import { getCurrentUserService } from '@/services/auth-service'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAnimalBasicInfo(input: UpdateAnimalBasicInfoInput) {
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
    const validatedData = updateAnimalBasicInfoSchema.parse(input)

    // 개체 소유권 확인 (같은 테넌트인지 확인)
    const animal = await prisma.animal.findUnique({
      where: { id: validatedData.id },
      select: { tenantId: true },
    })

    if (!animal) {
      return { success: false, error: '개체를 찾을 수 없습니다.' }
    }

    if (animal.tenantId !== tenantId) {
      return { success: false, error: '권한이 없습니다.' }
    }

    // 개체 기본정보 업데이트 (개체명, 성별, 공개여부, 브리딩 대상, 부모 공개여부, 해칭일, 폐사일)
    const updatedAnimal = await prisma.animal.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        gender: validatedData.gender,
        isPublic: validatedData.isPublic,
        isBreeding: validatedData.isBreeding,
        parentPublic: validatedData.parentPublic,
        hatchDate: validatedData.hatchDate,
        deathDate: validatedData.deathDate,
      },
    })

    // 캐시 갱신
    revalidatePath('/animals')
    revalidatePath(`/animals/${validatedData.id}`)

    return {
      success: true,
      data: updatedAnimal,
    }
  } catch (error) {
    console.error('Error updating animal basic info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '개체 정보 수정에 실패했습니다.',
    }
  }
}
