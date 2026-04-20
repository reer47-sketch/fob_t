import { prisma } from '@/lib/prisma'
import type { Gender } from '@prisma/client'

// 판매 개체 정보 타입
export interface SalesAnimal {
  id: string
  uniqueId: string
  name: string | null
  gender: Gender
  imageUrl: string | null
  morphs: Array<{ id: string; name: string }>
  traits: Array<{ id: string; name: string }>
  adoptionDate: Date
  price: number
  isReported: boolean
}

// PDF 생성용 확장 판매 개체 정보 타입
export interface SalesAnimalForPdf {
  id: string
  uniqueId: string
  name: string | null
  scientificName: string | null // 학명
  morphs: Array<{ id: string; name: string }>
  traits: Array<{ id: string; name: string }>
  adoptionDate: Date
  price: number
  transferPurpose: string | null // 양도 용도
  transferReason: string | null // 양도 사유
  // 양도인 (판매자 = Tenant)
  seller: {
    name: string // Tenant 이름
    address: string | null
    phone: string
    reporterName: string // 신고인 (User 이름)
  }
  // 양수인 (구매자)
  buyer: {
    name: string
    address: string | null
    phone: string
  }
}

// 판매이력 조회 파라미터
export interface GetSalesParams {
  tenantId: string
  speciesId?: string
  morphIds?: string[]
  traitIds?: string[]
  gender?: Gender
  minPrice?: number
  maxPrice?: number
  isReported?: boolean
  yearMonth?: string // YYYY-MM 형식
  uniqueId?: string
  page?: number
  pageSize?: number
}

// 판매이력 조회 결과
export interface GetSalesResult {
  animals: SalesAnimal[]
  total: number
  totalPages: number
}

/**
 * 판매이력 조회
 */
export async function getSales(params: GetSalesParams): Promise<GetSalesResult> {
  const {
    tenantId,
    speciesId,
    morphIds,
    traitIds,
    gender,
    minPrice,
    maxPrice,
    isReported,
    yearMonth,
    uniqueId,
    page = 1,
    pageSize = 15,
  } = params

  // 기본 조건: 분양된 개체만
  const whereConditions: any = {
    tenantId,
    isDel: false,
    adoption: {
      isNot: null,
    },
  }

  // 개체 ID/이름 부분검색
  if (uniqueId) {
    whereConditions.OR = [
      { uniqueId: { contains: uniqueId, mode: 'insensitive' } },
      { name: { contains: uniqueId, mode: 'insensitive' } },
    ]
  }

  // 성별 필터
  if (gender) {
    whereConditions.gender = gender
  }

  // AND 조건을 담을 배열
  const andConditions: any[] = []

  // 종 필터
  if (speciesId) {
    andConditions.push({
      codes: {
        some: {
          codeId: speciesId,
          code: { category: 'SPECIES' },
        },
      },
    })
  }

  // 모프 필터
  if (morphIds && morphIds.length > 0) {
    andConditions.push({
      codes: {
        some: {
          codeId: { in: morphIds },
          code: { category: 'MORPH' },
        },
      },
    })
  }

  // 형질 필터
  if (traitIds && traitIds.length > 0) {
    andConditions.push({
      codes: {
        some: {
          codeId: { in: traitIds },
          code: { category: 'TRAIT' },
        },
      },
    })
  }

  // AND 조건이 있으면 추가
  if (andConditions.length > 0) {
    whereConditions.AND = andConditions
  }

  // 금액, 신고상태, 년월 필터 (adoption 테이블에서)
  if (minPrice !== undefined || maxPrice !== undefined || isReported !== undefined || yearMonth) {
    const adoptionFilters: any = {}

    if (minPrice !== undefined) {
      adoptionFilters.price = { gte: minPrice }
    }

    if (maxPrice !== undefined) {
      if (adoptionFilters.price) {
        adoptionFilters.price.lte = maxPrice
      } else {
        adoptionFilters.price = { lte: maxPrice }
      }
    }

    if (isReported !== undefined) {
      adoptionFilters.isReported = isReported
    }

    // 년월 필터 (YYYY-MM 형식)
    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number)
      if (year && month) {
        const startDate = new Date(year, month - 1, 1) // 월의 첫날
        const endDate = new Date(year, month, 0, 23, 59, 59, 999) // 월의 마지막날
        adoptionFilters.adoptionDate = {
          gte: startDate,
          lte: endDate,
        }
      }
    }

    whereConditions.adoption = adoptionFilters
  }

  // 전체 개수 조회
  const total = await prisma.animal.count({ where: whereConditions })

  // 페이지네이션 계산
  const totalPages = Math.ceil(total / pageSize)
  const skip = (page - 1) * pageSize

  // 판매 개체 조회
  const animals = await prisma.animal.findMany({
    where: whereConditions,
    select: {
      id: true,
      uniqueId: true,
      name: true,
      gender: true,
      images: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { imageUrl: true },
      },
      codes: {
        select: {
          code: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
      adoption: {
        select: {
          adoptionDate: true,
          price: true,
          isReported: true,
        },
      },
    },
    orderBy: { adoption: { adoptionDate: 'desc' } },
    skip,
    take: pageSize,
  })

  // 데이터 변환
  const salesAnimals: SalesAnimal[] = animals.map((animal) => {
    const morphs = animal.codes
      .filter((ac) => ac.code.category === 'MORPH')
      .map((ac) => ({ id: ac.code.id, name: ac.code.name }))

    const traits = animal.codes
      .filter((ac) => ac.code.category === 'TRAIT')
      .map((ac) => ({ id: ac.code.id, name: ac.code.name }))

    return {
      id: animal.id,
      uniqueId: animal.uniqueId,
      name: animal.name,
      gender: animal.gender,
      imageUrl: animal.images[0]?.imageUrl || null,
      morphs,
      traits,
      adoptionDate: animal.adoption?.adoptionDate || new Date(),
      price: animal.adoption?.price || 0,
      isReported: animal.adoption?.isReported || false,
    }
  })

  return {
    animals: salesAnimals,
    total,
    totalPages,
  }
}

/**
 * PDF 생성용 판매이력 조회 (전체 데이터, 페이지네이션 없음)
 */
export async function getSalesForPdf(params: Omit<GetSalesParams, 'page' | 'pageSize'> & { userId: string }): Promise<SalesAnimalForPdf[]> {
  const {
    tenantId,
    userId,
    speciesId,
    morphIds,
    traitIds,
    gender,
    minPrice,
    maxPrice,
    isReported,
    yearMonth,
    uniqueId,
  } = params

  // 기본 조건: 분양된 개체만
  const whereConditions: any = {
    tenantId,
    isDel: false,
    adoption: {
      isNot: null,
    },
  }

  // 개체 ID/이름 부분검색
  if (uniqueId) {
    whereConditions.OR = [
      { uniqueId: { contains: uniqueId, mode: 'insensitive' } },
      { name: { contains: uniqueId, mode: 'insensitive' } },
    ]
  }

  // 성별 필터
  if (gender) {
    whereConditions.gender = gender
  }

  // AND 조건을 담을 배열
  const andConditions: any[] = []

  // 종 필터
  if (speciesId) {
    andConditions.push({
      codes: {
        some: {
          codeId: speciesId,
          code: { category: 'SPECIES' },
        },
      },
    })
  }

  // 모프 필터
  if (morphIds && morphIds.length > 0) {
    andConditions.push({
      codes: {
        some: {
          codeId: { in: morphIds },
          code: { category: 'MORPH' },
        },
      },
    })
  }

  // 형질 필터
  if (traitIds && traitIds.length > 0) {
    andConditions.push({
      codes: {
        some: {
          codeId: { in: traitIds },
          code: { category: 'TRAIT' },
        },
      },
    })
  }

  // AND 조건이 있으면 추가
  if (andConditions.length > 0) {
    whereConditions.AND = andConditions
  }

  // 금액, 신고상태, 년월 필터 (adoption 테이블에서)
  if (minPrice !== undefined || maxPrice !== undefined || isReported !== undefined || yearMonth) {
    const adoptionFilters: any = {}

    if (minPrice !== undefined) {
      adoptionFilters.price = { gte: minPrice }
    }

    if (maxPrice !== undefined) {
      if (adoptionFilters.price) {
        adoptionFilters.price.lte = maxPrice
      } else {
        adoptionFilters.price = { lte: maxPrice }
      }
    }

    if (isReported !== undefined) {
      adoptionFilters.isReported = isReported
    }

    // 년월 필터 (YYYY-MM 형식)
    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number)
      if (year && month) {
        const startDate = new Date(year, month - 1, 1) // 월의 첫날
        const endDate = new Date(year, month, 0, 23, 59, 59, 999) // 월의 마지막날
        adoptionFilters.adoptionDate = {
          gte: startDate,
          lte: endDate,
        }
      }
    }

    whereConditions.adoption = adoptionFilters
  }

  // 판매자 정보 조회 (사용자 + 테넌트)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      phone: true,
      tenant: {
        select: {
          name: true,
          address: true,
        },
      },
    },
  })

  if (!user || !user.tenant) {
    throw new Error('User or Tenant not found')
  }

  const tenant = user.tenant
  const reporterName = user.name || ''
  const reporterPhone = user.phone || ''

  // 판매 개체 조회 (전체, 페이지네이션 없음)
  const animals = await prisma.animal.findMany({
    where: whereConditions,
    select: {
      id: true,
      uniqueId: true,
      name: true,
      codes: {
        select: {
          code: {
            select: {
              id: true,
              name: true,
              category: true,
              scientificName: true,
            },
          },
        },
      },
      adoption: {
        select: {
          adoptionDate: true,
          price: true,
          transferPurpose: true,
          transferReason: true,
          customer: {
            select: {
              name: true,
              phone: true,
              address: true,
            },
          },
        },
      },
    },
    orderBy: { adoption: { adoptionDate: 'desc' } },
  })

  // 데이터 변환
  const salesAnimalsForPdf: SalesAnimalForPdf[] = animals.map((animal) => {
    const morphs = animal.codes
      .filter((ac) => ac.code.category === 'MORPH')
      .map((ac) => ({ id: ac.code.id, name: ac.code.name }))

    const traits = animal.codes
      .filter((ac) => ac.code.category === 'TRAIT')
      .map((ac) => ({ id: ac.code.id, name: ac.code.name }))

    const species = animal.codes.find((ac) => ac.code.category === 'SPECIES')

    return {
      id: animal.id,
      uniqueId: animal.uniqueId,
      name: animal.name,
      scientificName: species?.code.scientificName || null,
      morphs,
      traits,
      adoptionDate: animal.adoption?.adoptionDate || new Date(),
      price: animal.adoption?.price || 0,
      transferPurpose: animal.adoption?.transferPurpose || null,
      transferReason: animal.adoption?.transferReason || null,
      seller: {
        name: tenant.name, // Tenant 이름
        phone: reporterPhone,
        address: tenant.address || null,
        reporterName, // 신고인 (User 이름)
      },
      buyer: {
        name: animal.adoption?.customer.name || '',
        phone: animal.adoption?.customer.phone || '',
        address: animal.adoption?.customer.address || null,
      },
    }
  })

  return salesAnimalsForPdf
}

/**
 * 신고 상태 업데이트
 */
export async function updateReportedStatus(params: {
  tenantId: string
  animalIds: string[]
}): Promise<number> {
  const { tenantId, animalIds } = params

  // 해당 개체들의 adoption 레코드 중 isReported가 false인 것만 true로 업데이트
  const result = await prisma.adoption.updateMany({
    where: {
      animal: {
        id: { in: animalIds },
        tenantId,
        isDel: false,
      },
      isReported: false,
    },
    data: {
      isReported: true,
    },
  })

  return result.count
}
