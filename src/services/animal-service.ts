import { prisma } from '@/lib/prisma'
import { Prisma, Animal, AnimalDetail, AnimalImage, Feeding } from '@prisma/client'
import type { GetAnimalsInput, CreateAnimalInput } from '@/actions/animals/schemas'
import { uploadToR2, deleteFromR2, getKeyFromUrl } from '@/lib/r2'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// 개체 목록 조회 결과 타입
export type AnimalListItem = Animal & {
  detail: AnimalDetail | null
  codes: Array<{
    isPrimary: boolean
    code: {
      id: string
      category: string
      code: string
      name: string
    }
  }>
  adoption: {
    adoptionDate: Date
  } | null
}

// 엑셀 다운로드용 개체 타입 (부모 정보 포함)
export type AnimalWithParents = Animal & {
  detail: AnimalDetail | null
  codes: Array<{
    isPrimary: boolean
    code: {
      id: string
      category: string
      code: string
      name: string
    }
  }>
  parents: Array<{
    parentType: string
    parent: {
      id: string
      name: string | null
      uniqueId: string
      codes: Array<{
        isPrimary: boolean
        code: {
          id: string
          category: string
          name: string
        }
      }>
    }
  }>
}

export type AnimalListResult = {
  animals: AnimalListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 소유자 정보 타입
export type OwnerInfo = {
  name: string
  phone: string
  address: string | null
  adoptionDate: Date
} | null

// 개체 상세 조회 결과 타입
export type AnimalDetailData = Omit<Animal, 'parentPublic'> & {
  parentPublic: boolean
  hatchDate: Date | null
  detail: AnimalDetail | null
  codes: Array<{
    isPrimary: boolean
    code: {
      id: string
      category: string
      code: string
      name: string
      parent: {
        id: string
        category: string
        code: string
        name: string
      } | null
    }
  }>
  parents: Array<{
    parentType: string
    parent: {
      id: string
      name: string | null
      uniqueId: string
      gender: string
      images: Array<{
        imageUrl: string
      }>
      codes: Array<{
        isPrimary: boolean
        code: {
          id: string
          category: string
          name: string
        }
      }>
    }
  }>
  images: Array<{
    id: string
    imageUrl: string
    displayOrder: number
    description: string | null
    createdAt: Date
  }>
  shop: {
    name: string
    address: string | null
    profileImage: string | null
  } | null
  owner: OwnerInfo
  latestFeeding: Feeding | null
}

/**
 * 개체 목록 조회 서비스
 */
export async function getAnimalsService(
  input: GetAnimalsInput,
  tenantId: string
): Promise<ServiceResponse<AnimalListResult>> {
  try {
    const {
      uniqueId,
      acquisitionDateFrom,
      acquisitionDateTo,
      hatchingDateFrom,
      hatchingDateTo,
      speciesId,
      morphIds,
      traitIds,
      colorIds,
      gender,
      parentId,
      acquisitionType,
      isBreeding,
      isAdopted,
      adoptionDateFrom,
      adoptionDateTo,
      page,
      pageSize,
    } = input

    // WHERE 조건 구성
    const where: Prisma.AnimalWhereInput = {
      tenantId,
      isDel: false,
    }

    // 고유개체ID 또는 이름 필터 (OR 조건)
    if (uniqueId) {
      where.OR = [
        {
          uniqueId: {
            contains: uniqueId,
            mode: 'insensitive', // 대소문자 구분 없이 검색
          },
        },
        {
          name: {
            contains: uniqueId,
            mode: 'insensitive', // 대소문자 구분 없이 검색
          },
        },
      ]
    }

    // 해칭/입양일 필터 (날짜만 비교, 시간 무시)
    if (acquisitionDateFrom || acquisitionDateTo) {
      where.acquisitionDate = {}
      if (acquisitionDateFrom) {
        // 해당 날짜의 00:00:00부터
        const fromDate = new Date(acquisitionDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        where.acquisitionDate.gte = fromDate
      }
      if (acquisitionDateTo) {
        // 해당 날짜의 23:59:59까지
        const toDate = new Date(acquisitionDateTo)
        toDate.setHours(23, 59, 59, 999)
        where.acquisitionDate.lte = toDate
      }
    }

    // 해칭일 필터 (날짜만 비교, 시간 무시)
    if (hatchingDateFrom || hatchingDateTo) {
      where.hatchDate = {}
      if (hatchingDateFrom) {
        // 해당 날짜의 00:00:00부터
        const fromDate = new Date(hatchingDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        where.hatchDate.gte = fromDate
      }
      if (hatchingDateTo) {
        // 해당 날짜의 23:59:59까지
        const toDate = new Date(hatchingDateTo)
        toDate.setHours(23, 59, 59, 999)
        where.hatchDate.lte = toDate
      }
    }

    // 성별 필터
    if (gender) {
      where.gender = gender
    }

    // 입양/해칭 필터
    if (acquisitionType) {
      where.acquisitionType = acquisitionType
    }

    // 종/모프/형질/색감 필터
    // 카테고리 간: AND, 카테고리 내: OR
    const codeConditions: Prisma.AnimalWhereInput[] = []

    // 종 필터
    if (speciesId) {
      codeConditions.push({
        codes: {
          some: {
            codeId: speciesId,
          },
        },
      })
    }

    // 모프 필터 (OR)
    if (morphIds && morphIds.length > 0) {
      codeConditions.push({
        codes: {
          some: {
            codeId: {
              in: morphIds,
            },
          },
        },
      })
    }

    // 형질 필터 (OR)
    if (traitIds && traitIds.length > 0) {
      codeConditions.push({
        codes: {
          some: {
            codeId: {
              in: traitIds,
            },
          },
        },
      })
    }

    // 색감 필터 (OR)
    if (colorIds && colorIds.length > 0) {
      codeConditions.push({
        codes: {
          some: {
            codeId: {
              in: colorIds,
            },
          },
        },
      })
    }

    // 모든 조건을 AND로 연결
    if (codeConditions.length > 0) {
      where.AND = codeConditions
    }

    // 부/모 ID 또는 이름 필터 (OR 조건)
    if (parentId) {
      where.parents = {
        some: {
          OR: [
            {
              parent: {
                uniqueId: {
                  contains: parentId,
                  mode: 'insensitive', // 대소문자 구분 없이 검색
                },
              },
            },
            {
              parent: {
                name: {
                  contains: parentId,
                  mode: 'insensitive', // 대소문자 구분 없이 검색
                },
              },
            },
          ],
        },
      }
    }

    // 브리딩 대상 필터
    if (isBreeding !== undefined) {
      where.isBreeding = isBreeding
    }

    // 분양여부 필터
    if (isAdopted !== undefined) {
      if (isAdopted) {
        // 분양된 개체: adoption 관계가 존재하는 개체
        where.adoption = {
          isNot: null,
        }
      } else {
        // 미분양 개체: adoption 관계가 없는 개체
        where.adoption = {
          is: null,
        }
      }
    }

    // 분양일 필터 (분양된 개체만 조회, 날짜만 비교, 시간 무시)
    if (adoptionDateFrom || adoptionDateTo) {
      const adoptionDateFilter: { gte?: Date; lte?: Date } = {}

      if (adoptionDateFrom) {
        // 해당 날짜의 00:00:00부터
        const fromDate = new Date(adoptionDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        adoptionDateFilter.gte = fromDate
      }
      if (adoptionDateTo) {
        // 해당 날짜의 23:59:59까지
        const toDate = new Date(adoptionDateTo)
        toDate.setHours(23, 59, 59, 999)
        adoptionDateFilter.lte = toDate
      }

      where.adoption = {
        adoptionDate: adoptionDateFilter,
      }
    }

    // 전체 개수 조회
    const total = await prisma.animal.count({ where })
    // 페이지네이션 계산
    const skip = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)

    // 개체 목록 조회 (부모 정보 제외 - 성능 최적화)
    const animals = await prisma.animal.findMany({
      where,
      include: {
        detail: true,
        codes: {
          select: {
            isPrimary: true,
            code: {
              select: {
                id: true,
                category: true,
                code: true,
                name: true,
              },
            },
          },
        },
        adoption: {
          select: {
            adoptionDate: true,
          },
        },
        images: {
          select: {
            imageUrl: true,
          },
          where: {
            displayOrder: 0,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    })

    return {
      success: true,
      data: {
        animals,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('getAnimalsService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to fetch animals' }
  }
}

// 라벨용 개체 타입 (부모 정보 포함)
export type AnimalWithParentsForLabel = AnimalListItem & {
  parents: Array<{
    parentType: string
    parent: {
      id: string
      name: string | null
      uniqueId: string
    }
  }>
}

/**
 * ID 목록으로 개체 목록 조회
 */
export async function getAnimalsByIdsService(
  animalIds: string[],
  tenantId: string
): Promise<ServiceResponse<AnimalListItem[]>> {
  try {
    const animals = await prisma.animal.findMany({
      where: {
        id: { in: animalIds },
        tenantId,
        isDel: false,
      },
      include: {
        detail: true,
        codes: {
          select: {
            isPrimary: true,
            code: {
              select: {
                id: true,
                category: true,
                code: true,
                name: true,
              },
            },
          },
        },
        adoption: {
          select: {
            adoptionDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: animals as AnimalListItem[],
    }
  } catch (error) {
    console.error('getAnimalsByIdsService error:', error)
    return { success: false, error: 'Failed to fetch animals by ids' }
  }
}

/**
 * ID 목록으로 개체 목록 조회 (라벨용 - 부모 정보 포함)
 */
export async function getAnimalsByIdsForLabelService(
  animalIds: string[],
  tenantId: string
): Promise<ServiceResponse<AnimalWithParentsForLabel[]>> {
  try {
    const animals = await prisma.animal.findMany({
      where: {
        id: { in: animalIds },
        tenantId,
        isDel: false,
      },
      include: {
        detail: true,
        codes: {
          select: {
            isPrimary: true,
            code: {
              select: {
                id: true,
                category: true,
                code: true,
                name: true,
              },
            },
          },
        },
        adoption: {
          select: {
            adoptionDate: true,
          },
        },
        parents: {
          select: {
            parentType: true,
            parent: {
              select: {
                id: true,
                name: true,
                uniqueId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: animals as AnimalWithParentsForLabel[],
    }
  } catch (error) {
    console.error('getAnimalsByIdsForLabelService error:', error)
    return { success: false, error: 'Failed to fetch animals by ids for label' }
  }
}

/**
 * 엑셀 다운로드용 개체 목록 조회 서비스 (부모 정보 포함)
 */
export async function getAnimalsForExportService(
  input: GetAnimalsInput,
  tenantId: string
): Promise<ServiceResponse<{ animals: AnimalWithParents[] }>> {
  try {
    const {
      uniqueId,
      acquisitionDateFrom,
      acquisitionDateTo,
      hatchingDateFrom,
      hatchingDateTo,
      speciesId,
      morphIds,
      traitIds,
      colorIds,
      gender,
      parentId,
      acquisitionType,
      isBreeding,
      isAdopted,
      adoptionDateFrom,
      adoptionDateTo,
    } = input

    // WHERE 조건 구성 (getAnimalsService와 동일)
    const where: Prisma.AnimalWhereInput = {
      tenantId,
      isDel: false,
    }

    // 고유개체ID 또는 이름 필터 (OR 조건)
    if (uniqueId) {
      where.OR = [
        {
          uniqueId: {
            contains: uniqueId,
            mode: 'insensitive', // 대소문자 구분 없이 검색
          },
        },
        {
          name: {
            contains: uniqueId,
            mode: 'insensitive', // 대소문자 구분 없이 검색
          },
        },
      ]
    }

    // 해칭/입양일 필터 (날짜만 비교, 시간 무시)
    if (acquisitionDateFrom || acquisitionDateTo) {
      where.acquisitionDate = {}
      if (acquisitionDateFrom) {
        // 해당 날짜의 00:00:00부터
        const fromDate = new Date(acquisitionDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        where.acquisitionDate.gte = fromDate
      }
      if (acquisitionDateTo) {
        // 해당 날짜의 23:59:59까지
        const toDate = new Date(acquisitionDateTo)
        toDate.setHours(23, 59, 59, 999)
        where.acquisitionDate.lte = toDate
      }
    }

    // 해칭일 필터 (날짜만 비교, 시간 무시)
    if (hatchingDateFrom || hatchingDateTo) {
      where.hatchDate = {}
      if (hatchingDateFrom) {
        // 해당 날짜의 00:00:00부터
        const fromDate = new Date(hatchingDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        where.hatchDate.gte = fromDate
      }
      if (hatchingDateTo) {
        // 해당 날짜의 23:59:59까지
        const toDate = new Date(hatchingDateTo)
        toDate.setHours(23, 59, 59, 999)
        where.hatchDate.lte = toDate
      }
    }

    if (gender) {
      where.gender = gender
    }

    if (acquisitionType) {
      where.acquisitionType = acquisitionType
    }

    const codeConditions: Prisma.AnimalWhereInput[] = []

    if (speciesId) {
      codeConditions.push({
        codes: { some: { codeId: speciesId } },
      })
    }

    if (morphIds && morphIds.length > 0) {
      codeConditions.push({
        codes: { some: { codeId: { in: morphIds } } },
      })
    }

    if (traitIds && traitIds.length > 0) {
      codeConditions.push({
        codes: { some: { codeId: { in: traitIds } } },
      })
    }

    if (colorIds && colorIds.length > 0) {
      codeConditions.push({
        codes: { some: { codeId: { in: colorIds } } },
      })
    }

    if (codeConditions.length > 0) {
      where.AND = codeConditions
    }

    // 부/모 ID 또는 이름 필터 (OR 조건)
    if (parentId) {
      where.parents = {
        some: {
          OR: [
            {
              parent: {
                uniqueId: {
                  contains: parentId,
                  mode: 'insensitive', // 대소문자 구분 없이 검색
                },
              },
            },
            {
              parent: {
                name: {
                  contains: parentId,
                  mode: 'insensitive', // 대소문자 구분 없이 검색
                },
              },
            },
          ],
        },
      }
    }

    if (isBreeding !== undefined) {
      where.isBreeding = isBreeding
    }

    // 분양여부 필터
    if (isAdopted !== undefined) {
      if (isAdopted) {
        // 분양된 개체: adoption 관계가 존재하는 개체
        where.adoption = {
          isNot: null,
        }
      } else {
        // 미분양 개체: adoption 관계가 없는 개체
        where.adoption = {
          is: null,
        }
      }
    }

    // 분양일 필터 (분양된 개체만 조회, 날짜만 비교, 시간 무시)
    if (adoptionDateFrom || adoptionDateTo) {
      const adoptionDateFilter: { gte?: Date; lte?: Date } = {}

      if (adoptionDateFrom) {
        // 해당 날짜의 00:00:00부터
        const fromDate = new Date(adoptionDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        adoptionDateFilter.gte = fromDate
      }
      if (adoptionDateTo) {
        // 해당 날짜의 23:59:59까지
        const toDate = new Date(adoptionDateTo)
        toDate.setHours(23, 59, 59, 999)
        adoptionDateFilter.lte = toDate
      }

      where.adoption = {
        adoptionDate: adoptionDateFilter,
      }
    }

    // 전체 데이터 조회 (페이징 없음, 부모 정보 포함)
    const animals = await prisma.animal.findMany({
      where,
      include: {
        detail: true,
        codes: {
          select: {
            isPrimary: true,
            code: {
              select: {
                id: true,
                category: true,
                code: true,
                name: true,
              },
            },
          },
        },
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                uniqueId: true,
                codes: {
                  select: {
                    isPrimary: true,
                    code: {
                      select: {
                        id: true,
                        category: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: { animals },
    }
  } catch (error) {
    console.error('getAnimalsForExportService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to fetch animals for export' }
  }
}

/**
 * 개체 생성 서비스
 */
export async function createAnimalService(
  input: CreateAnimalInput,
  tenantId: string
): Promise<ServiceResponse<Animal>> {
  try {
    const {
      name,
      gender,
      acquisitionType,
      acquisitionDate,
      hatchDate,
      speciesId,
      primaryMorphId,
      comboMorphIds = [],
      imageFile,
      metadata,
      fathers,
      mothers,
      isBreeding,
      isPublic,
      parentPublic,
    } = input

    // 1. 테넌트(샵) 정보 조회 - slug 가져오기
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

    // 2. 대표 모프 코드 가져오기 (선택적)
    let morphCode = ''
    if (primaryMorphId) {
      const morph = await prisma.code.findUnique({
        where: { id: primaryMorphId },
        select: { code: true },
      })
      morphCode = morph?.code || ''
    }

    // 3. 입양/해칭일을 한국 시간으로 변환 후 YYYYMMDD 형식으로 변환
    const koreaTime = toZonedTime(acquisitionDate, 'Asia/Seoul')
    const dateStr = format(koreaTime, 'yyyyMMdd')

    const datePrefix = `${tenant.slug}${morphCode}${dateStr}`

    // 4. 동일 prefix를 가진 가장 최근 uniqueId 조회 → 다음 시퀀스 결정
    const lastAnimal = await prisma.animal.findFirst({
      where: {
        tenantId,
        uniqueId: { startsWith: datePrefix },
      },
      orderBy: { uniqueId: 'desc' },
      select: { uniqueId: true },
    })

    let sequence = 1
    if (lastAnimal) {
      const lastSeq = parseInt(lastAnimal.uniqueId.slice(-4), 10)
      if (!isNaN(lastSeq)) sequence = lastSeq + 1
    }

    const sequenceStr = String(sequence).padStart(4, '0')
    const uniqueId = `${datePrefix}${sequenceStr}`

    // 5. 이미지 업로드 (있는 경우)
    let imageUrl: string | undefined
    if (imageFile) {
      // 짧은 난수 생성 (8자리 16진수)
      const randomId = Math.random().toString(36).substring(2, 10)
      const key = `animals/${tenant.slug}/${randomId}-${imageFile.name}`
      console.log(key)
      imageUrl = await uploadToR2(key, imageFile, imageFile.type)
    }

    // 6. 트랜잭션으로 Animal + AnimalImage 생성
    const animal = await prisma.$transaction(async (tx) => {
      // 개체 생성
      const newAnimal = await tx.animal.create({
        data: {
          tenantId,
          name,
          uniqueId,
          gender,
          acquisitionType,
          acquisitionDate,
          hatchDate: hatchDate || null, // 해칭일 (입양인 경우 선택 사항)
          isBreeding: isBreeding ?? false, // 브리딩 대상 여부 (기본값: false)
          isPublic: isPublic ?? true, // 공개 여부 (기본값: true)
          parentPublic: parentPublic ?? true, // 부모 공개 여부 (기본값: true)
        },
      })

      // 종/대표 모프/콤보 모프 코드 연결 (선택적)
      const codeIds: string[] = []
      if (speciesId) codeIds.push(speciesId)
      if (primaryMorphId) codeIds.push(primaryMorphId)

      if (codeIds.length > 0 || comboMorphIds.length > 0) {
        // 대표 모프와 종은 isPrimary: true로 저장
        const primaryCodes = codeIds.map((codeId) => ({
          animalId: newAnimal.id,
          codeId,
          isPrimary: true,
        }))

        // 콤보 모프는 isPrimary: false로 저장
        const comboCodes = comboMorphIds.map((codeId) => ({
          animalId: newAnimal.id,
          codeId,
          isPrimary: false,
        }))

        await tx.animalCode.createMany({
          data: [...primaryCodes, ...comboCodes],
        })
      }

      // 이미지 저장 (있는 경우)
      if (imageUrl) {
        await tx.animalImage.create({
          data: {
            animalId: newAnimal.id,
            imageUrl,
            displayOrder: 0,
            description: metadata
              ? `촬영일시: ${metadata.capturedAt ? format(metadata.capturedAt, 'yyyy-MM-dd HH:mm:ss') : '알 수 없음'}`
              : undefined,
          },
        })
      }

      // 부모 정보 저장 (있는 경우)
      const parentRelations: Array<{ animalId: string; parentId: string; parentType: 'FATHER' | 'MOTHER' }> = []

      if (fathers && fathers.length > 0) {
        fathers.forEach((fatherId) => {
          parentRelations.push({
            animalId: newAnimal.id,
            parentId: fatherId,
            parentType: 'FATHER',
          })
        })
      }

      if (mothers && mothers.length > 0) {
        mothers.forEach((motherId) => {
          parentRelations.push({
            animalId: newAnimal.id,
            parentId: motherId,
            parentType: 'MOTHER',
          })
        })
      }

      if (parentRelations.length > 0) {
        await tx.animalParent.createMany({
          data: parentRelations,
        })
      }

      return newAnimal
    })

    const animalId = animal.id
      const qrCodeUrl = '/guest/animals/' + animalId
      await prisma.animal.update({
        where: {
          id: animalId
        },
        data: {
          qrCodeUrl: qrCodeUrl
        }
      })

    return {
      success: true,
      data: animal,
    }
  } catch (error) {
    console.error('createAnimalService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: '데이터베이스 오류가 발생했습니다. 다시 시도해주세요.' }
    }

    // 에러 메시지에 따라 더 구체적인 정보 제공
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('R2') || errorMessage.includes('upload') || errorMessage.includes('S3')) {
      return { success: false, error: '이미지 업로드에 실패했습니다. 네트워크 연결을 확인해주세요.' }
    }

    return { success: false, error: '개체 등록에 실패했습니다. 네트워크 연결을 확인 후 다시 시도해주세요.' }
  }
}

/**
 * 개체 상세 조회 서비스
 */
export async function getAnimalDetailService(
  animalId: string,
  tenantId: string
): Promise<ServiceResponse<AnimalDetailData>> {
  try {
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        tenantId,
        isDel: false,
      },
      include: {
        detail: true,
        codes: {
          select: {
            isPrimary: true,
            code: {
              include: {
                parent: {
                  select: {
                    id: true,
                    category: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                uniqueId: true,
                gender: true,
                images: {
                  orderBy: {
                    displayOrder: 'asc',
                  },
                  take: 1,
                  select: {
                    imageUrl: true,
                  },
                },
                codes: {
                  select: {
                    isPrimary: true,
                    code: {
                      select: {
                        id: true,
                        category: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    })

    if (!animal) {
      return { success: false, error: 'Animal not found' }
    }

    // 최신 분양 기록에서 소유자 정보 조회
    const latestAdoption = await prisma.adoption.findFirst({
      where: {
        animalId,
      },
      orderBy: {
        adoptionDate: 'desc',
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    })

    const owner: OwnerInfo = latestAdoption
      ? {
          name: latestAdoption.customer.name,
          phone: latestAdoption.customer.phone,
          address: latestAdoption.customer.address,
          adoptionDate: latestAdoption.adoptionDate,
        }
      : null

    // 최근 피딩 정보 조회
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
      data: {
        ...animal,
        shop: null,
        owner,
        latestFeeding,
      },
    }
  } catch (error) {
    console.error('getAnimalDetailService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to fetch animal detail' }
  }
}

/**
 * 개체 이미지 업로드 서비스
 * 최대 3개까지만 추가 이미지 업로드 가능 (기본 이미지 제외)
 */
export async function uploadAnimalImageService(
  animalId: string,
  tenantId: string,
  imageFile: File
): Promise<ServiceResponse<AnimalImage>> {
  try {
    // 1. 개체 존재 확인 및 권한 체크
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        tenantId,
        isDel: false,
      },
      include: {
        images: true,
        tenant: {
          select: {
            slug: true,
          },
        },
      },
    })

    if (!animal) {
      return { success: false, error: '개체를 찾을 수 없습니다' }
    }

    // 2. 이미지 개수 확인 (최대 4개: 기본 1개 + 추가 3개)
    if (animal.images.length >= 4) {
      return { success: false, error: '최대 4개까지만 이미지를 업로드할 수 있습니다' }
    }

    // 3. R2에 이미지 업로드
    const randomId = Math.random().toString(36).substring(2, 10)
    const key = `animals/${animal.tenant.slug}/${randomId}-${imageFile.name}`
    const imageUrl = await uploadToR2(key, imageFile, imageFile.type)

    // 4. 다음 displayOrder 계산
    const maxDisplayOrder = Math.max(...animal.images.map(img => img.displayOrder), -1)
    const nextDisplayOrder = maxDisplayOrder + 1

    // 5. 데이터베이스에 이미지 정보 저장
    const newImage = await prisma.animalImage.create({
      data: {
        animalId,
        imageUrl,
        displayOrder: nextDisplayOrder,
        description: null,
      },
    })

    return {
      success: true,
      data: newImage,
    }
  } catch (error) {
    console.error('uploadAnimalImageService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to upload image' }
  }
}

// 부모 검색용 타입
export type ParentAnimalInfo = {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  imageUrl?: string
  speciesName?: string
  morphName?: string
}

/**
 * 모든 개체 검색 서비스 (브리딩 조건 무시)
 * 삭제되지 않은 모든 개체를 ID 또는 이름으로 검색
 */
export async function searchAllAnimalsService(
  tenantId: string,
  searchTerm: string,
  excludeAnimalId?: string,
  gender?: 'MALE' | 'FEMALE'
): Promise<ServiceResponse<ParentAnimalInfo[]>> {
  try {
    // 양쪽 공백 제거
    const trimmedSearchTerm = searchTerm.trim()

    const animals = await prisma.animal.findMany({
      where: {
        tenantId,
        isDel: false,
        // 본인 제외
        ...(excludeAnimalId && { id: { not: excludeAnimalId } }),
        // 성별 필터 (선택 사항)
        ...(gender && { gender }),
        OR: [
          {
            uniqueId: {
              contains: trimmedSearchTerm,
              mode: 'insensitive', // 대소문자 구분 없이 검색
            },
          },
          {
            name: {
              contains: trimmedSearchTerm,
              mode: 'insensitive', // 대소문자 구분 없이 검색
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        uniqueId: true,
        gender: true,
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
          take: 1,
          select: {
            imageUrl: true,
          },
        },
        codes: {
          include: {
            code: {
              select: {
                id: true,
                category: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        uniqueId: 'asc',
      },
      take: 100,
    })

    if (animals.length === 0) {
      return {
        success: false,
        error: '검색 조건에 맞는 개체를 찾을 수 없습니다.',
      }
    }

    const animalInfos: ParentAnimalInfo[] = animals.map((animal) => {
      const speciesCode = animal.codes.find((c) => c.code.category === 'SPECIES')
      const morphCode = animal.codes.find((c) => c.code.category === 'MORPH')

      return {
        id: animal.id,
        name: animal.name,
        uniqueId: animal.uniqueId,
        gender: animal.gender,
        imageUrl: animal.images[0]?.imageUrl,
        speciesName: speciesCode?.code.name,
        morphName: morphCode?.code.name,
      }
    })

    return {
      success: true,
      data: animalInfos,
    }
  } catch (error) {
    console.error('searchAllAnimalsService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: '개체 검색 중 오류가 발생했습니다.' }
  }
}

/**
 * 부모 개체 검색 서비스
 * 브리딩 가능한 개체를 ID 또는 이름으로 검색
 */
export async function searchParentAnimalsService(
  tenantId: string,
  searchTerm: string,
  gender: 'MALE' | 'FEMALE',
  excludeAnimalId?: string
): Promise<ServiceResponse<ParentAnimalInfo[]>> {
  try {
    // 양쪽 공백 제거
    const trimmedSearchTerm = searchTerm.trim()

    const animals = await prisma.animal.findMany({
      where: {
        tenantId,
        isDel: false,
        gender,
        isBreeding: true,
        // 본인 제외
        ...(excludeAnimalId && { id: { not: excludeAnimalId } }),
        OR: [
          {
            uniqueId: {
              contains: trimmedSearchTerm,
              mode: 'insensitive', // 대소문자 구분 없이 검색
            },
          },
          {
            name: {
              contains: trimmedSearchTerm,
              mode: 'insensitive', // 대소문자 구분 없이 검색
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        uniqueId: true,
        gender: true,
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
          take: 1,
          select: {
            imageUrl: true,
          },
        },
        codes: {
          include: {
            code: {
              select: {
                id: true,
                category: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        uniqueId: 'asc',
      },
      take: 10,
    })

    if (animals.length === 0) {
      return {
        success: false,
        error: `브리딩 가능한 ${gender === 'MALE' ? '수컷' : '암컷'} 개체를 찾을 수 없습니다.`,
      }
    }

    const parentInfos: ParentAnimalInfo[] = animals.map((animal) => {
      const speciesCode = animal.codes.find((c) => c.code.category === 'SPECIES')
      const morphCode = animal.codes.find((c) => c.code.category === 'MORPH')

      return {
        id: animal.id,
        name: animal.name,
        uniqueId: animal.uniqueId,
        gender: animal.gender,
        imageUrl: animal.images[0]?.imageUrl,
        speciesName: speciesCode?.code.name,
        morphName: morphCode?.code.name,
      }
    })

    return {
      success: true,
      data: parentInfos,
    }
  } catch (error) {
    console.error('searchParentAnimalsService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: '개체 검색 중 오류가 발생했습니다.' }
  }
}

/**
 * 개체 이미지 삭제 서비스
 * displayOrder가 0인 기본 이미지는 삭제 불가
 */
export async function deleteAnimalImageService(
  imageId: string,
  tenantId: string
): Promise<ServiceResponse<void>> {
  try {
    // 1. 이미지 조회 및 권한 체크
    const image = await prisma.animalImage.findFirst({
      where: {
        id: imageId,
      },
      include: {
        animal: {
          select: {
            tenantId: true,
            isDel: true,
          },
        },
      },
    })

    if (!image) {
      return { success: false, error: '이미지를 찾을 수 없습니다' }
    }

    if (image.animal.tenantId !== tenantId) {
      return { success: false, error: '권한이 없습니다' }
    }

    if (image.animal.isDel) {
      return { success: false, error: '삭제된 개체의 이미지입니다' }
    }

    // 2. 기본 이미지(displayOrder === 0)는 삭제 불가
    if (image.displayOrder === 0) {
      return { success: false, error: '기본 이미지는 삭제할 수 없습니다' }
    }

    // 3. R2에서 파일 삭제
    const key = getKeyFromUrl(image.imageUrl)
    await deleteFromR2(key)

    // 4. 데이터베이스에서 이미지 삭제
    await prisma.animalImage.delete({
      where: {
        id: imageId,
      },
    })

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('deleteAnimalImageService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to delete image' }
  }
}

/**
 * 개체 이미지 교체 서비스
 * 기존 이미지를 새 이미지로 교체 (R2 업로드 → DB 업데이트 → 이전 파일 삭제)
 */
export async function replaceAnimalImageService(
  imageId: string,
  tenantId: string,
  newImageFile: File
): Promise<ServiceResponse<AnimalImage>> {
  try {
    // 1. 이미지 조회 및 권한 체크
    const image = await prisma.animalImage.findFirst({
      where: { id: imageId },
      include: {
        animal: {
          select: {
            tenantId: true,
            isDel: true,
            tenant: { select: { slug: true } },
          },
        },
      },
    })

    if (!image) {
      return { success: false, error: '이미지를 찾을 수 없습니다' }
    }

    if (image.animal.tenantId !== tenantId) {
      return { success: false, error: '권한이 없습니다' }
    }

    if (image.animal.isDel) {
      return { success: false, error: '삭제된 개체의 이미지입니다' }
    }

    // 2. 새 이미지를 R2에 업로드
    const randomId = Math.random().toString(36).substring(2, 10)
    const key = `animals/${image.animal.tenant.slug}/${randomId}-${newImageFile.name}`
    const newImageUrl = await uploadToR2(key, newImageFile, newImageFile.type)

    // 3. 이전 이미지 R2에서 삭제
    const oldKey = getKeyFromUrl(image.imageUrl)
    await deleteFromR2(oldKey)

    // 4. DB에서 이미지 URL 업데이트
    const updatedImage = await prisma.animalImage.update({
      where: { id: imageId },
      data: { imageUrl: newImageUrl },
    })

    return { success: true, data: updatedImage }
  } catch (error) {
    console.error('replaceAnimalImageService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: 'Failed to replace image' }
  }
}

/**
 * 개체 삭제 서비스
 * isDel 플래그를 true로 설정하여 소프트 삭제
 */
export async function deleteAnimalService(
  animalId: string,
  tenantId: string
): Promise<ServiceResponse<void>> {
  try {
    // 1. 개체 존재 확인 및 권한 체크
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        tenantId,
        isDel: false,
      },
    })

    if (!animal) {
      return { success: false, error: '개체를 찾을 수 없습니다' }
    }

    // 2. 소프트 삭제 (isDel 플래그 설정)
    await prisma.animal.update({
      where: {
        id: animalId,
      },
      data: {
        isDel: true,
      },
    })

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('deleteAnimalService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: '개체 삭제 중 오류가 발생했습니다' }
  }
}

/**
 * Public 개체 상세 조회 서비스 (Guest용)
 * isPublic이 true인 경우에만 조회 가능, tenantId 체크 없음
 */
export async function getPublicAnimalDetailService(
  animalId: string
): Promise<ServiceResponse<AnimalDetailData>> {
  try {
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        isDel: false,
        isPublic: true, // Public으로 설정된 개체만 조회
      },
      include: {
        detail: true,
        codes: {
          select: {
            isPrimary: true,
            code: {
              include: {
                parent: {
                  select: {
                    id: true,
                    category: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                uniqueId: true,
                gender: true,
                images: {
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                  select: {
                    imageUrl: true,
                    createdAt: true,
                  },
                },
                codes: {
                  select: {
                    isPrimary: true,
                    code: {
                      select: {
                        id: true,
                        category: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    })

    if (!animal) {
      return { success: false, error: '개체를 찾을 수 없거나 공개되지 않았습니다.' }
    }

    // 샵(테넌트) 정보 조회
    const tenantWithUser = await prisma.tenant.findUnique({
      where: { id: animal.tenantId },
      select: {
        name: true,
        address: true,
        users: {
          where: { profileImage: { not: null } },
          select: { profileImage: true },
          take: 1,
        },
      },
    })

    const shop = tenantWithUser
      ? {
          name: tenantWithUser.name,
          address: tenantWithUser.address,
          profileImage: tenantWithUser.users[0]?.profileImage ?? null,
        }
      : null

    // 최신 분양 기록에서 소유자 정보 조회
    const latestAdoption = await prisma.adoption.findFirst({
      where: {
        animalId,
      },
      orderBy: {
        adoptionDate: 'desc',
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    })

    const owner: OwnerInfo = latestAdoption
      ? {
          name: latestAdoption.customer.name,
          phone: latestAdoption.customer.phone,
          address: latestAdoption.customer.address,
          adoptionDate: latestAdoption.adoptionDate,
        }
      : null

    // 최근 피딩 정보 조회
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
      data: {
        ...animal,
        shop,
        owner,
        latestFeeding,
      },
    }
  } catch (error) {
    console.error('getPublicAnimalDetailService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Database error occurred' }
    }

    return { success: false, error: '개체 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 일괄 개체 생성 서비스 (관리자용)
 */
export async function bulkCreateAnimalsService(
  items: Array<{
    name: string | null
    gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
    hatchDate: Date | null
    speciesId: string
    primaryMorphId: string
    acquisitionType: 'ADOPTION' | 'HATCHING'
    imageFile?: File
  }>,
  tenantId: string
): Promise<ServiceResponse<{ created: number; failed: number; errors: string[] }>> {
  try {
    // 1. 테넌트 slug 조회
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    })

    if (!tenant || !tenant.slug) {
      return { success: false, error: '샵 slug 정보를 찾을 수 없습니다' }
    }

    let created = 0
    const errors: string[] = []

    // 2. 사전 데이터 조회 (루프 밖에서 1회)
    const now = new Date()
    const koreaTime = toZonedTime(now, 'Asia/Seoul')
    const dateStr = format(koreaTime, 'yyyyMMdd')

    // 모프 코드 일괄 조회
    const morphIds = [...new Set(items.map((item) => item.primaryMorphId))]
    const morphRecords = await prisma.code.findMany({
      where: { id: { in: morphIds } },
      select: { id: true, code: true },
    })
    const morphMap = new Map(morphRecords.map((m) => [m.id, m.code]))

    // 시퀀스 시작값 조회 (1회만)
    const lastAnimal = await prisma.animal.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { uniqueId: true, acquisitionDate: true },
    })

    let sequence = 1
    if (lastAnimal) {
      const lastKoreaTime = toZonedTime(lastAnimal.acquisitionDate, 'Asia/Seoul')
      const lastDateStr = format(lastKoreaTime, 'yyyyMMdd')
      if (lastDateStr === dateStr) {
        const lastSequence = lastAnimal.uniqueId.slice(-4)
        sequence = parseInt(lastSequence, 10) + 1
      }
    }

    // 3. 이미지 병렬 업로드 (5개씩)
    const CONCURRENCY = 5
    const imageUrls: (string | undefined)[] = new Array(items.length)

    for (let start = 0; start < items.length; start += CONCURRENCY) {
      const batch = items.slice(start, start + CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map(async (item, batchIdx) => {
          if (!item.imageFile) return undefined
          const randomId = Math.random().toString(36).substring(2, 10)
          const key = `animals/${tenant.slug}/${randomId}-${item.imageFile.name}`
          return await uploadToR2(key, item.imageFile, item.imageFile.type)
        })
      )
      results.forEach((result, batchIdx) => {
        imageUrls[start + batchIdx] =
          result.status === 'fulfilled' ? result.value : undefined
      })
    }

    // 4. 개체별 DB 생성 (순차 — uniqueId 시퀀스 보장)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const morphCode = morphMap.get(item.primaryMorphId) || ''
        const uniqueId = `${tenant.slug}${morphCode}${dateStr}${String(sequence).padStart(4, '0')}`
        sequence++

        const imageUrl = imageUrls[i]

        await prisma.$transaction(async (tx) => {
          const newAnimal = await tx.animal.create({
            data: {
              tenantId,
              name: item.name,
              uniqueId,
              gender: item.gender,
              acquisitionType: item.acquisitionType,
              acquisitionDate: now,
              hatchDate: item.hatchDate || null,
              isBreeding: false,
              isPublic: false,
              parentPublic: true,
            },
          })

          // 종/모프 코드 연결
          await tx.animalCode.createMany({
            data: [
              { animalId: newAnimal.id, codeId: item.speciesId, isPrimary: true },
              { animalId: newAnimal.id, codeId: item.primaryMorphId, isPrimary: true },
            ],
          })

          // 이미지 저장
          if (imageUrl) {
            await tx.animalImage.create({
              data: {
                animalId: newAnimal.id,
                imageUrl,
                displayOrder: 0,
              },
            })
          }

          // QR URL 설정
          await tx.animal.update({
            where: { id: newAnimal.id },
            data: { qrCodeUrl: `/guest/animals/${newAnimal.id}` },
          })
        })

        created++
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류'
        errors.push(`${i + 1}번째 개체(${item.name || '이름없음'}): ${msg}`)
      }
    }

    return {
      success: true,
      data: { created, failed: errors.length, errors },
    }
  } catch (error) {
    console.error('bulkCreateAnimalsService error:', error)
    return { success: false, error: '일괄 등록에 실패했습니다.' }
  }
}
