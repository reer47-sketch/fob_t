'use server'

import { prisma } from '@/lib/prisma'
import { CodeCategory } from '@prisma/client'
import * as XLSX from 'xlsx'

export async function exportCodeSheet(): Promise<
  | { success: true; data: { buffer: number[]; filename: string } }
  | { success: false; error: string }
> {
  try {
    // 종 목록 (SPECIES)
    const species = await prisma.code.findMany({
      where: { category: CodeCategory.SPECIES, isDel: false },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, code: true, name: true },
    })

    // 모프 목록 (MORPH) — 종별로 그룹화
    const morphs = await prisma.code.findMany({
      where: { category: CodeCategory.MORPH, isDel: false },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        code: true,
        name: true,
        parentId: true,
        parent: { select: { code: true, name: true } },
      },
    })

    // 종 시트 데이터
    const speciesRows = species.map((s) => ({
      '코드': s.code,
      '종 이름': s.name,
    }))

    // 모프 시트 데이터 (종별로 정렬)
    const morphRows = morphs.map((m) => ({
      '종 코드': m.parent?.code || '',
      '종 이름': m.parent?.name || '',
      '모프 코드': m.code,
      '모프 이름': m.name,
    }))

    const wb = XLSX.utils.book_new()

    // 종 시트
    const speciesWs = XLSX.utils.json_to_sheet(speciesRows)
    speciesWs['!cols'] = [{ wch: 12 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, speciesWs, '종 코드')

    // 모프 시트
    const morphWs = XLSX.utils.json_to_sheet(morphRows)
    morphWs['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 12 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, morphWs, '모프 코드')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return {
      success: true,
      data: {
        buffer: Array.from(new Uint8Array(buf)),
        filename: '코드표_종_모프.xlsx',
      },
    }
  } catch (error) {
    console.error('exportCodeSheet error:', error)
    return { success: false, error: '코드표 생성에 실패했습니다.' }
  }
}
