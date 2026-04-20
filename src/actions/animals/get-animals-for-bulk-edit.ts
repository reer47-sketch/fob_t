'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { hasBulkFeature } from '@/lib/permissions'

export interface BulkEditAnimal {
  id: string
  uniqueId: string
  name: string | null
  gender: string
  hatchDate: Date | null
  deathDate: Date | null
  isPublic: boolean
  isBreeding: boolean
  parentPublic: boolean
  acquisitionType: string
  imageUrl: string | null
  species: { id: string; code: string; name: string } | null
  primaryMorph: { id: string; code: string; name: string } | null
  comboMorphs: { id: string; code: string; name: string }[]
  detail: {
    quality: string | null
    currentSize: string | null
    tailStatus: string | null
    patternType: string | null
    distinctiveMarks: string | null
    healthStatus: string | null
    isMating: boolean
    cageInfo: string | null
    flooringInfo: string | null
    habitatNotes: string | null
  } | null
}

export async function getAnimalsForBulkEdit(animalIds?: string[]) {
  try {
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false as const, error: '로그인이 필요합니다.' }
    }

    if (!hasBulkFeature(userResult.data)) {
      return { success: false as const, error: '유료 기능입니다.' }
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return { success: false as const, error: '소속 테넌트가 없습니다.' }
    }

    const animals = await prisma.animal.findMany({
      where: {
        ...(animalIds ? { id: { in: animalIds } } : {}),
        tenantId,
        isDel: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        codes: {
          include: { code: true },
        },
        detail: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
          select: { imageUrl: true },
        },
      },
    })

    const data: BulkEditAnimal[] = animals.map((animal) => {
      const speciesCode = animal.codes.find((c) => c.code.category === 'SPECIES')
      const primaryMorphCode = animal.codes.find(
        (c) => c.code.category === 'MORPH' && c.isPrimary
      )
      const comboMorphCodes = animal.codes.filter(
        (c) => c.code.category === 'MORPH' && !c.isPrimary
      )

      return {
        id: animal.id,
        uniqueId: animal.uniqueId,
        name: animal.name,
        gender: animal.gender,
        hatchDate: animal.hatchDate,
        deathDate: animal.deathDate,
        isPublic: animal.isPublic,
        isBreeding: animal.isBreeding,
        parentPublic: animal.parentPublic,
        acquisitionType: animal.acquisitionType,
        imageUrl: animal.images[0]?.imageUrl ?? null,
        species: speciesCode
          ? { id: speciesCode.code.id, code: speciesCode.code.code, name: speciesCode.code.name }
          : null,
        primaryMorph: primaryMorphCode
          ? { id: primaryMorphCode.code.id, code: primaryMorphCode.code.code, name: primaryMorphCode.code.name }
          : null,
        comboMorphs: comboMorphCodes.map((c) => ({
          id: c.code.id,
          code: c.code.code,
          name: c.code.name,
        })),
        detail: animal.detail
          ? {
              quality: animal.detail.quality,
              currentSize: animal.detail.currentSize,
              tailStatus: animal.detail.tailStatus,
              patternType: animal.detail.patternType,
              distinctiveMarks: animal.detail.distinctiveMarks,
              healthStatus: animal.detail.healthStatus,
              isMating: animal.detail.isMating,
              cageInfo: animal.detail.cageInfo,
              flooringInfo: animal.detail.flooringInfo,
              habitatNotes: animal.detail.habitatNotes,
            }
          : null,
      }
    })

    return { success: true as const, data }
  } catch (error) {
    console.error('getAnimalsForBulkEdit error:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : '데이터 로드 중 오류가 발생했습니다',
    }
  }
}
