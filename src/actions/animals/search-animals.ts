'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { prisma } from '@/lib/prisma'

export interface AnimalSearchResult {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  speciesName?: string
  morphName?: string
}

export async function searchAnimals(query: string): Promise<{ success: boolean; data?: AnimalSearchResult[]; error?: string }> {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }

  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  const term = query.trim()

  try {
    const animals = await prisma.animal.findMany({
      where: {
        tenantId,
        isDel: false,
        OR: [
          { uniqueId: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { acquisitionDate: 'desc' },
      select: {
        id: true,
        name: true,
        uniqueId: true,
        gender: true,
        codes: {
          select: {
            isPrimary: true,
            code: { select: { name: true, category: true } },
          },
        },
      },
    })

    const data: AnimalSearchResult[] = animals.map(a => {
      const speciesCode = a.codes.find(c => c.isPrimary && c.code.category === 'SPECIES')
      const morphCode = a.codes.find(c => c.isPrimary && c.code.category !== 'SPECIES')
      return {
        id: a.id,
        name: a.name,
        uniqueId: a.uniqueId,
        gender: a.gender,
        speciesName: speciesCode?.code.name,
        morphName: morphCode?.code.name,
      }
    })

    return { success: true, data }
  } catch (e) {
    console.error('searchAnimals error:', e)
    return { success: false, error: '검색 중 오류가 발생했습니다.' }
  }
}
