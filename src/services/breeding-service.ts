import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { GetBreedingsInput, GetParentAnimalsInput } from '@/actions/breedings/schemas'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// 부모 개체 타입
export type ParentAnimal = {
  id: string
  uniqueId: string
  name: string | null
}

// 자식 개체 타입 (브리딩 결과)
export type BreedingOffspring = {
  id: string
  uniqueId: string
  name: string | null
  hatchDate: Date | null
  imageUrl: string | null
  fathers: ParentAnimal[]
  mother: ParentAnimal | null
}

// 브리딩 목록 조회 결과
export type BreedingListResult = {
  offsprings: BreedingOffspring[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 브리딩 자식 개체 목록 조회 서비스
 * - 부모 정보가 있는 모든 개체 조회
 */
export async function getBreedingsService(
  input: GetBreedingsInput,
  tenantId: string
): Promise<ServiceResponse<BreedingListResult>> {
  try {
    const { fatherId, motherId, page, pageSize } = input

    // WHERE 조건 구성
    const where: Prisma.AnimalWhereInput = {
      tenantId,
      isDel: false,
      acquisitionType: 'HATCHING', // 해칭 데이터만 조회
    }

    // 부모 필터 조건
    const parentConditions: Prisma.AnimalWhereInput[] = []

    if (fatherId) {
      parentConditions.push({
        parents: {
          some: {
            parentId: fatherId,
            parentType: 'FATHER',
          },
        },
      })
    }

    if (motherId) {
      parentConditions.push({
        parents: {
          some: {
            parentId: motherId,
            parentType: 'MOTHER',
          },
        },
      })
    }

    if (parentConditions.length > 0) {
      where.AND = parentConditions
    }

    // 전체 개수 조회
    const total = await prisma.animal.count({ where })
    const skip = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)

    // 개체 목록 조회
    const animals = await prisma.animal.findMany({
      where,
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                uniqueId: true,
                name: true,
                gender: true,
              },
            },
          },
        },
        images: {
          orderBy: {
            createdAt: 'desc', // 가장 최근 사진
          },
          take: 1,
          select: {
            imageUrl: true,
          },
        },
      },
      orderBy: {
        hatchDate: 'desc',
      },
      skip,
      take: pageSize,
    })

    // 결과 변환
    const offsprings: BreedingOffspring[] = animals.map((animal) => {
      const fathers = animal.parents
        .filter((p) => p.parentType === 'FATHER')
        .map((p) => ({
          id: p.parent.id,
          uniqueId: p.parent.uniqueId,
          name: p.parent.name,
        }))

      const motherRelation = animal.parents.find((p) => p.parentType === 'MOTHER')
      const mother = motherRelation
        ? {
            id: motherRelation.parent.id,
            uniqueId: motherRelation.parent.uniqueId,
            name: motherRelation.parent.name,
          }
        : null

      return {
        id: animal.id,
        uniqueId: animal.uniqueId,
        name: animal.name,
        hatchDate: animal.hatchDate,
        imageUrl: animal.images[0]?.imageUrl || null,
        fathers,
        mother,
      }
    })

    return {
      success: true,
      data: {
        offsprings,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('getBreedingsService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to fetch breedings' }
  }
}

/**
 * 부모 후보 개체 목록 조회 (성별로 필터)
 */
export async function getParentAnimalsService(
  input: GetParentAnimalsInput,
  tenantId: string
): Promise<ServiceResponse<ParentAnimal[]>> {
  try {
    const { gender } = input

    const animals = await prisma.animal.findMany({
      where: {
        tenantId,
        isDel: false,
        gender,
      },
      select: {
        id: true,
        uniqueId: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: animals,
    }
  } catch (error) {
    console.error('getParentAnimalsService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to fetch parent animals' }
  }
}
