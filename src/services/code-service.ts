import { prisma } from '@/lib/prisma'
import { CodeCategory } from '@prisma/client'

/**
 * 코드 서비스
 * 카테고리, 종, 모프, 형질, 색깔 등의 코드 데이터를 관리
 */

// ============================================
// 카테고리 (1뎁스) 관련
// ============================================

// 카테고리 목록 조회
export async function getCategories() {
  const categories = await prisma.code.findMany({
    where: {
      category: CodeCategory.CATEGORY,
      parentId: null,
      isDel: false,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      _count: {
        select: {
          children: {
            where: {
              isDel: false,
            },
          },
        },
      },
    },
  })

  return categories.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    deletable: c._count.children === 0,
  }))
}

// 카테고리 생성
export async function createCategory(data: {
  code: string
  name: string
  description?: string
  displayOrder?: number
}) {
  return await prisma.code.create({
    data: {
      category: CodeCategory.CATEGORY,
      code: data.code,
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder ?? 0,
      parentId: null,
    },
  })
}

// 카테고리 삭제 (하위 종이 없을 때만)
export async function deleteCategory(id: string) {
  const category = await prisma.code.findUnique({
    where: { id },
    select: {
      category: true,
      _count: {
        select: {
          children: {
            where: { isDel: false },
          },
        },
      },
    },
  })

  if (!category) {
    throw new Error('카테고리를 찾을 수 없습니다.')
  }

  if (category.category !== CodeCategory.CATEGORY) {
    throw new Error('카테고리 코드만 삭제할 수 있습니다.')
  }

  if (category._count.children > 0) {
    throw new Error('하위 종이 있는 카테고리는 삭제할 수 없습니다.')
  }

  return await prisma.code.update({
    where: { id },
    data: { isDel: true },
  })
}

// ============================================
// 종 (2뎁스) 관련
// ============================================

// 특정 카테고리의 종 목록 조회
export async function getSpeciesByCategory(categoryId: string) {
  const species = await prisma.code.findMany({
    where: {
      category: CodeCategory.SPECIES,
      parentId: categoryId,
      isDel: false,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      scientificName: true,
      _count: {
        select: {
          children: {
            where: { isDel: false },
          },
          animalCodes: true,
        },
      },
    },
  })

  return species.map(s => ({
    id: s.id,
    code: s.code,
    name: s.name,
    scientificName: s.scientificName,
    deletable: s._count.children === 0 && s._count.animalCodes === 0,
  }))
}

// 전체 종 목록 조회 (Admin용)
export async function getAllSpecies() {
  const species = await prisma.code.findMany({
    where: {
      category: CodeCategory.SPECIES,
      isDel: false,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      scientificName: true,
      parentId: true,
      _count: {
        select: {
          children: {
            where: { isDel: false },
          },
          animalCodes: true,
        },
      },
    },
  })

  return species.map(s => ({
    id: s.id,
    code: s.code,
    name: s.name,
    scientificName: s.scientificName,
    parentId: s.parentId,
    deletable: s._count.children === 0 && s._count.animalCodes === 0,
  }))
}

// 테넌트에 설정된 종 목록 조회 (BREEDER용)
export async function getSpeciesForTenant(tenantId: string) {
  const tenantCodes = await prisma.tenantCode.findMany({
    where: {
      tenantId,
      code: { isDel: false },
    },
    orderBy: [
      { code: { displayOrder: 'asc' } },
      { code: { createdAt: 'asc' } },
    ],
    select: {
      code: {
        select: {
          id: true,
          code: true,
          name: true,
          scientificName: true,
        },
      },
    },
  })

  return tenantCodes.map(tc => ({
    id: tc.code.id,
    code: tc.code.code,
    name: tc.code.name,
    scientificName: tc.code.scientificName,
  }))
}

// 종 코드 생성 (카테고리 하위)
export async function createSpecies(data: {
  parentId: string
  code: string
  name: string
  scientificName: string
  description?: string
  displayOrder?: number
}) {
  return await prisma.code.create({
    data: {
      category: CodeCategory.SPECIES,
      code: data.code,
      name: data.name,
      scientificName: data.scientificName,
      description: data.description,
      displayOrder: data.displayOrder ?? 0,
      parentId: data.parentId,
    },
  })
}

// 종 삭제 (하위 코드와 개체가 없을 때만 삭제 가능)
export async function deleteSpecies(id: string) {
  const species = await prisma.code.findUnique({
    where: { id },
    select: {
      category: true,
      _count: {
        select: {
          children: {
            where: { isDel: false },
          },
          animalCodes: true,
        },
      },
    },
  })

  if (!species) {
    throw new Error('종을 찾을 수 없습니다.')
  }

  if (species.category !== CodeCategory.SPECIES) {
    throw new Error('종 코드만 삭제할 수 있습니다.')
  }

  if (species._count.children > 0) {
    throw new Error('하위 코드가 있는 종은 삭제할 수 없습니다.')
  }

  if (species._count.animalCodes > 0) {
    throw new Error('사용 중인 개체가 있는 종은 삭제할 수 없습니다.')
  }

  return await prisma.code.update({
    where: { id },
    data: { isDel: true },
  })
}

// ============================================
// 하위 코드 (3뎁스: 모프/형질/색깔) 관련
// ============================================

// 특정 종의 하위 코드(모프/형질/색깔) 조회
export async function getCodesByParentAndCategory(
  parentId: string,
  category: CodeCategory
) {
  return await prisma.code.findMany({
    where: {
      parentId,
      category,
      isDel: false,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      code: true,
      name: true,
    },
  })
}

// 특정 종의 모프 목록 조회
export async function getMorphsBySpeciesId(speciesId: string) {
  return getCodesByParentAndCategory(speciesId, CodeCategory.MORPH)
}

// 특정 종의 형질 목록 조회
export async function getTraitsBySpeciesId(speciesId: string) {
  return getCodesByParentAndCategory(speciesId, CodeCategory.TRAIT)
}

// 특정 종의 색깔 목록 조회
export async function getColorsBySpeciesId(speciesId: string) {
  return getCodesByParentAndCategory(speciesId, CodeCategory.COLOR)
}

// 특정 종의 모든 3뎁스 코드 한번에 조회
export async function getAllChildCodesBySpeciesId(speciesId: string) {
  const codes = await prisma.code.findMany({
    where: {
      parentId: speciesId,
      isDel: false,
    },
    orderBy: [
      { category: 'asc' },
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      description: true,
      displayOrder: true,
      _count: {
        select: {
          animalCodes: true,
        },
      },
    },
  })

  return {
    morphs: codes.filter(c => c.category === CodeCategory.MORPH),
    traits: codes.filter(c => c.category === CodeCategory.TRAIT),
    colors: codes.filter(c => c.category === CodeCategory.COLOR),
  }
}

// 3뎁스 코드 생성 (모프/형질/색깔)
export async function createChildCode(data: {
  parentId: string
  category: CodeCategory
  code: string
  name: string
  description?: string
  displayOrder?: number
}) {
  return await prisma.code.create({
    data: {
      category: data.category,
      code: data.code,
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder ?? 0,
      parentId: data.parentId,
    },
  })
}

// 코드 수정
export async function updateCode(
  id: string,
  data: {
    code?: string
    name?: string
    scientificName?: string
    description?: string
    displayOrder?: number
  }
) {
  return await prisma.code.update({
    where: { id },
    data,
  })
}

// 코드 삭제 (소프트 삭제)
export async function deleteCode(id: string) {
  const codeWithCount = await prisma.code.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          animalCodes: true,
        },
      },
    },
  })

  if (!codeWithCount) {
    throw new Error('코드를 찾을 수 없습니다.')
  }

  if (codeWithCount._count.animalCodes > 0) {
    throw new Error('사용 중인 코드는 삭제할 수 없습니다.')
  }

  return await prisma.code.update({
    where: { id },
    data: { isDel: true },
  })
}
