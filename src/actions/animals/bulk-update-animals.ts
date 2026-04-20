'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { hasBulkFeature } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { Gender } from '@prisma/client'

interface AnimalPatch {
  name?: string | null
  gender?: Gender
  hatchDate?: string | null
  deathDate?: string | null
  isPublic?: boolean
  isBreeding?: boolean
  parentPublic?: boolean
  quality?: string | null
  currentSize?: string | null
  tailStatus?: string | null
  patternType?: string | null
  distinctiveMarks?: string | null
  healthStatus?: string | null
  isMating?: boolean
  cageInfo?: string | null
  flooringInfo?: string | null
  habitatNotes?: string | null
  comboMorphIds?: string[]
}

interface BulkUpdateItem {
  animalId: string
  patch: AnimalPatch
}

export async function bulkUpdateAnimals(items: BulkUpdateItem[]) {
  try {
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    if (!hasBulkFeature(userResult.data)) {
      return { success: false, error: '유료 기능입니다. 플랜을 업그레이드해주세요.' }
    }

    const tenantId = userResult.data.tenantId
    if (!tenantId) {
      return { success: false, error: '소속 테넌트가 없습니다.' }
    }

    if (!items || items.length === 0) {
      return { success: false, error: '수정할 항목이 없습니다.' }
    }

    // 모든 개체가 사용자의 테넌트 소유인지 검증
    const animalIds = items.map((i) => i.animalId)
    const animals = await prisma.animal.findMany({
      where: { id: { in: animalIds }, tenantId },
      select: { id: true },
    })
    const ownedIds = new Set(animals.map((a) => a.id))
    const unauthorized = animalIds.filter((id) => !ownedIds.has(id))
    if (unauthorized.length > 0) {
      return { success: false, error: `권한 없는 개체가 포함되어 있습니다. (${unauthorized.length}건)` }
    }

    // 개체별 개별 트랜잭션으로 업데이트 (대량 처리 시 timeout 방지)
    const errors: Array<{ animalId: string; message: string }> = []
    let updatedCount = 0

    for (const item of items) {
      try {
        const { animalId, patch } = item

        await prisma.$transaction(async (tx) => {
          // Animal 모델 직접 필드
          const animalUpdate: Record<string, unknown> = {}
          if (patch.name !== undefined) animalUpdate.name = patch.name
          if (patch.gender !== undefined) animalUpdate.gender = patch.gender
          if (patch.hatchDate !== undefined) animalUpdate.hatchDate = patch.hatchDate ? new Date(patch.hatchDate) : null
          if (patch.deathDate !== undefined) animalUpdate.deathDate = patch.deathDate ? new Date(patch.deathDate) : null
          if (patch.isPublic !== undefined) animalUpdate.isPublic = patch.isPublic
          if (patch.isBreeding !== undefined) animalUpdate.isBreeding = patch.isBreeding
          if (patch.parentPublic !== undefined) animalUpdate.parentPublic = patch.parentPublic

          if (Object.keys(animalUpdate).length > 0) {
            await tx.animal.update({
              where: { id: animalId },
              data: animalUpdate,
            })
          }

          // AnimalDetail 필드
          const detailUpdate: Record<string, unknown> = {}
          if (patch.quality !== undefined) detailUpdate.quality = patch.quality
          if (patch.currentSize !== undefined) detailUpdate.currentSize = patch.currentSize
          if (patch.tailStatus !== undefined) detailUpdate.tailStatus = patch.tailStatus
          if (patch.patternType !== undefined) detailUpdate.patternType = patch.patternType
          if (patch.distinctiveMarks !== undefined) detailUpdate.distinctiveMarks = patch.distinctiveMarks
          if (patch.healthStatus !== undefined) detailUpdate.healthStatus = patch.healthStatus
          if (patch.isMating !== undefined) detailUpdate.isMating = patch.isMating
          if (patch.cageInfo !== undefined) detailUpdate.cageInfo = patch.cageInfo
          if (patch.flooringInfo !== undefined) detailUpdate.flooringInfo = patch.flooringInfo
          if (patch.habitatNotes !== undefined) detailUpdate.habitatNotes = patch.habitatNotes

          if (Object.keys(detailUpdate).length > 0) {
            await tx.animalDetail.upsert({
              where: { animalId },
              create: { animalId, ...detailUpdate },
              update: detailUpdate,
            })
          }

          // 콤보 모프 업데이트
          if (patch.comboMorphIds !== undefined) {
            const existingCombos = await tx.animalCode.findMany({
              where: { animalId },
              include: { code: true },
            })
            const comboEntries = existingCombos.filter(
              (ac) => ac.code.category === 'MORPH' && !ac.isPrimary
            )
            if (comboEntries.length > 0) {
              await tx.animalCode.deleteMany({
                where: { id: { in: comboEntries.map((e) => e.id) } },
              })
            }
            if (patch.comboMorphIds.length > 0) {
              await tx.animalCode.createMany({
                data: patch.comboMorphIds.map((codeId) => ({
                  animalId,
                  codeId,
                  isPrimary: false,
                })),
              })
            }
          }
        })

        updatedCount++
      } catch (err) {
        errors.push({
          animalId: item.animalId,
          message: err instanceof Error ? err.message : '업데이트 실패',
        })
      }
    }

    revalidatePath('/animals')

    return {
      success: true,
      data: { updatedCount, errors },
    }
  } catch (error) {
    console.error('bulkUpdateAnimals error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '일괄 수정 중 오류가 발생했습니다',
    }
  }
}
