'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { prisma } from '@/lib/prisma'

export interface UpdateAnimalParentsInput {
  animalId: string
  father1Id?: string | null
  father2Id?: string | null
  mother1Id?: string | null
  mother2Id?: string | null
}

export async function updateAnimalParents(input: UpdateAnimalParentsInput) {
  const session = await getCurrentUserService()

  if (!session?.success || !session.data) {
    return { success: false, error: 'Unauthorized' }
  }

  const tenantId = session.data.tenantId
  if (!tenantId) {
    return { success: false, error: 'Tenant not found' }
  }

  try {
    const { animalId, father1Id, father2Id, mother1Id, mother2Id } = input

    // 개체가 존재하고 tenantId가 일치하는지 확인
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        tenantId,
        isDel: false,
      },
    })

    if (!animal) {
      return { success: false, error: '개체를 찾을 수 없습니다.' }
    }

    // 트랜잭션으로 부모 정보 업데이트
    await prisma.$transaction(async (tx) => {
      // 기존 부모 관계 모두 삭제
      await tx.animalParent.deleteMany({
        where: {
          animalId,
        },
      })

      // 새로운 부모 관계 생성
      if (father1Id) {
        // 부모 개체가 존재하는지 확인
        const parent = await tx.animal.findFirst({
          where: {
            id: father1Id,
            tenantId,
            isDel: false,
          },
        })

        if (!parent) {
          throw new Error('부1 개체를 찾을 수 없습니다.')
        }

        await tx.animalParent.create({
          data: {
            animalId,
            parentId: father1Id,
            parentType: 'FATHER',
          },
        })
      }

      if (father2Id) {
        const parent = await tx.animal.findFirst({
          where: {
            id: father2Id,
            tenantId,
            isDel: false,
          },
        })

        if (!parent) {
          throw new Error('부2 개체를 찾을 수 없습니다.')
        }

        await tx.animalParent.create({
          data: {
            animalId,
            parentId: father2Id,
            parentType: 'FATHER',
          },
        })
      }

      if (mother1Id) {
        const parent = await tx.animal.findFirst({
          where: {
            id: mother1Id,
            tenantId,
            isDel: false,
          },
        })

        if (!parent) {
          throw new Error('모1 개체를 찾을 수 없습니다.')
        }

        await tx.animalParent.create({
          data: {
            animalId,
            parentId: mother1Id,
            parentType: 'MOTHER',
          },
        })
      }

      if (mother2Id) {
        const parent = await tx.animal.findFirst({
          where: {
            id: mother2Id,
            tenantId,
            isDel: false,
          },
        })

        if (!parent) {
          throw new Error('모2 개체를 찾을 수 없습니다.')
        }

        await tx.animalParent.create({
          data: {
            animalId,
            parentId: mother2Id,
            parentType: 'MOTHER',
          },
        })
      }
    })

    return { success: true }
  } catch (error) {
    console.error('updateAnimalParents error:', error)

    if (error instanceof Error) {
      return { success: false, error: error.message }
    }

    return { success: false, error: '부모 정보 업데이트 중 오류가 발생했습니다.' }
  }
}
