'use server'

import { prisma } from '@/lib/prisma'
import type { CreateAdoptionInput, UpdateAdoptionInput } from '@/actions/adoptions/schemas'
import type { Gender } from '@prisma/client'

// 분양 가능한 개체 타입
export interface AvailableAnimal {
  id: string
  uniqueId: string
  name: string | null
  gender: Gender
  acquisitionDate: Date
  species: string | null
  morph: string | null
}

// 분양 가능한 개체 조회 서비스 (아직 분양되지 않은 개체)
export async function getAvailableAnimalsService(
  tenantId: string,
  search?: string
): Promise<{ success: true; data: AvailableAnimal[] } | { success: false; error: string }> {
  try {
    const animals = await prisma.animal.findMany({
      where: {
        tenantId,
        isDel: false,
        // 분양 기록이 없는 개체만
        adoption: {
          is: null,
        },
        // 검색어가 있으면 uniqueId나 name으로 검색
        ...(search && {
          OR: [
            { uniqueId: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      },
      include: {
        codes: {
          include: {
            code: {
              select: {
                category: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // 최대 50개까지만
    })

    const formattedAnimals: AvailableAnimal[] = animals.map((animal) => {
      const speciesCode = animal.codes.find((c) => c.code.category === 'SPECIES')
      const morphCode = animal.codes.find((c) => c.code.category === 'MORPH')

      return {
        id: animal.id,
        uniqueId: animal.uniqueId,
        name: animal.name,
        gender: animal.gender,
        acquisitionDate: animal.acquisitionDate,
        species: speciesCode?.code.name || null,
        morph: morphCode?.code.name || null,
      }
    })

    return { success: true, data: formattedAnimals }
  } catch (error) {
    console.error('getAvailableAnimalsService error:', error)
    return { success: false, error: 'Failed to fetch available animals' }
  }
}

// 분양 생성 서비스
export async function createAdoptionService(
  input: CreateAdoptionInput,
  tenantId: string
): Promise<{ success: true; data: { count: number } } | { success: false; error: string }> {
  try {
    const { customerId, adoptionDate, transferPurpose, transferReason, items } = input

    // 고객 존재 확인
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    // 개체들이 해당 테넌트 소속이고 아직 분양되지 않았는지 확인
    const animalIds = items.map((item) => item.animalId)
    const animals = await prisma.animal.findMany({
      where: {
        id: { in: animalIds },
        tenantId,
        isDel: false,
      },
      include: {
        adoption: true,
      },
    })

    if (animals.length !== animalIds.length) {
      return { success: false, error: '일부 개체를 찾을 수 없습니다' }
    }

    const alreadyAdopted = animals.filter((a) => a.adoption !== null)
    if (alreadyAdopted.length > 0) {
      return {
        success: false,
        error: `이미 분양된 개체가 포함되어 있습니다: ${alreadyAdopted.map((a) => a.uniqueId).join(', ')}`,
      }
    }

    // 분양 기록 생성
    await prisma.adoption.createMany({
      data: items.map((item) => ({
        customerId,
        animalId: item.animalId,
        adoptionDate,
        price: item.price,
        transferPurpose: transferPurpose || null,
        transferReason: transferReason || null,
      })),
    })

    return { success: true, data: { count: items.length } }
  } catch (error) {
    console.error('createAdoptionService error:', error)
    return { success: false, error: 'Failed to create adoption' }
  }
}

// 고객의 입양 내역 타입
export interface CustomerAdoptionItem {
  id: string
  adoptionDate: Date
  price: number
  isReported: boolean
  transferPurpose: string | null
  transferReason: string | null
  animal: {
    id: string
    uniqueId: string
    name: string | null
    gender: Gender
    species: string | null
    morph: string | null
    imageUrl: string | null
  }
}

// 고객의 입양 내역 조회 서비스
export async function getCustomerAdoptionsService(
  customerId: string,
  tenantId: string
): Promise<{ success: true; data: CustomerAdoptionItem[] } | { success: false; error: string }> {
  try {
    // 고객 존재 확인
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    const adoptions = await prisma.adoption.findMany({
      where: { customerId },
      include: {
        animal: {
          include: {
            codes: {
              include: {
                code: {
                  select: {
                    category: true,
                    name: true,
                  },
                },
              },
            },
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { adoptionDate: 'desc' },
    })

    const formattedAdoptions: CustomerAdoptionItem[] = adoptions.map((adoption) => {
      const speciesCode = adoption.animal.codes.find((c) => c.code.category === 'SPECIES')
      const morphCode = adoption.animal.codes.find((c) => c.code.category === 'MORPH')

      return {
        id: adoption.id,
        adoptionDate: adoption.adoptionDate,
        price: adoption.price,
        isReported: adoption.isReported,
        transferPurpose: adoption.transferPurpose,
        transferReason: adoption.transferReason,
        animal: {
          id: adoption.animal.id,
          uniqueId: adoption.animal.uniqueId,
          name: adoption.animal.name,
          gender: adoption.animal.gender,
          species: speciesCode?.code.name || null,
          morph: morphCode?.code.name || null,
          imageUrl: adoption.animal.images[0]?.imageUrl || null,
        },
      }
    })

    return { success: true, data: formattedAdoptions }
  } catch (error) {
    console.error('getCustomerAdoptionsService error:', error)
    return { success: false, error: 'Failed to fetch customer adoptions' }
  }
}

// 입양 삭제 서비스
export async function deleteAdoptionService(
  adoptionId: string,
  tenantId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // 입양 기록 존재 및 테넌트 확인
    const adoption = await prisma.adoption.findFirst({
      where: { id: adoptionId },
      include: {
        customer: {
          select: { tenantId: true },
        },
      },
    })

    if (!adoption) {
      return { success: false, error: '입양 기록을 찾을 수 없습니다' }
    }

    if (adoption.customer.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.adoption.delete({
      where: { id: adoptionId },
    })

    return { success: true }
  } catch (error) {
    console.error('deleteAdoptionService error:', error)
    return { success: false, error: 'Failed to delete adoption' }
  }
}

// 양수양도 신고 업데이트 서비스
export async function updateAdoptionReportService(
  adoptionId: string,
  isReported: boolean,
  tenantId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // 입양 기록 존재 및 테넌트 확인
    const adoption = await prisma.adoption.findFirst({
      where: { id: adoptionId },
      include: {
        customer: {
          select: { tenantId: true },
        },
      },
    })

    if (!adoption) {
      return { success: false, error: '입양 기록을 찾을 수 없습니다' }
    }

    if (adoption.customer.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.adoption.update({
      where: { id: adoptionId },
      data: { isReported },
    })

    return { success: true }
  } catch (error) {
    console.error('updateAdoptionReportService error:', error)
    return { success: false, error: 'Failed to update adoption report status' }
  }
}

// 분양 정보 업데이트 서비스
export async function updateAdoptionService(
  input: UpdateAdoptionInput,
  tenantId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { adoptionId, adoptionDate, price, transferPurpose, transferReason } = input

    // 입양 기록 존재 및 테넌트 확인
    const adoption = await prisma.adoption.findFirst({
      where: { id: adoptionId },
      include: {
        customer: {
          select: { tenantId: true },
        },
      },
    })

    if (!adoption) {
      return { success: false, error: '입양 기록을 찾을 수 없습니다' }
    }

    if (adoption.customer.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.adoption.update({
      where: { id: adoptionId },
      data: {
        adoptionDate,
        price,
        transferPurpose: transferPurpose || null,
        transferReason: transferReason || null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('updateAdoptionService error:', error)
    return { success: false, error: 'Failed to update adoption' }
  }
}
