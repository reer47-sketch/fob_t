import { prisma } from '@/lib/prisma'
import { CodeCategory } from '@prisma/client'

/**
 * 테넌트 코드 서비스
 * 테넌트별 종(SPECIES) 설정 관리
 */

// 테넌트가 설정한 종 ID 목록 조회
export async function getTenantSpeciesIds(tenantId: string) {
  const tenantCodes = await prisma.tenantCode.findMany({
    where: { tenantId },
    select: { codeId: true },
  })

  return tenantCodes.map(tc => tc.codeId)
}

// 테넌트 종 설정 저장 (기존 삭제 후 일괄 등록)
export async function setTenantSpecies(tenantId: string, speciesIds: string[]) {
  await prisma.$transaction([
    prisma.tenantCode.deleteMany({
      where: { tenantId },
    }),
    ...speciesIds.map(codeId =>
      prisma.tenantCode.create({
        data: { tenantId, codeId },
      })
    ),
  ])
}

// 카테고리별로 그룹핑된 전체 종 목록 + 테넌트 선택 여부
export async function getAllSpeciesWithTenantSelection(tenantId: string) {
  const [categories, tenantSpeciesIds] = await Promise.all([
    prisma.code.findMany({
      where: {
        category: CodeCategory.CATEGORY,
        parentId: null,
        isDel: false,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        children: {
          where: {
            category: CodeCategory.SPECIES,
            isDel: false,
          },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            code: true,
            name: true,
            scientificName: true,
          },
        },
      },
    }),
    getTenantSpeciesIds(tenantId),
  ])

  return categories.map(cat => ({
    id: cat.id,
    code: cat.code,
    name: cat.name,
    species: cat.children.map(sp => ({
      id: sp.id,
      code: sp.code,
      name: sp.name,
      scientificName: sp.scientificName,
      selected: tenantSpeciesIds.includes(sp.id),
    })),
  }))
}
