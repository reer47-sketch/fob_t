'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { prisma } from '@/lib/prisma'

export async function getAllAnimalIds(gender?: 'MALE' | 'FEMALE' | 'UNKNOWN'): Promise<{ success: boolean; data?: string[]; count?: number; error?: string }> {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }

  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  try {
    const animals = await prisma.animal.findMany({
      where: { tenantId, isDel: false, ...(gender ? { gender } : {}) },
      select: { id: true },
    })

    return { success: true, data: animals.map(a => a.id), count: animals.length }
  } catch (e) {
    console.error('getAllAnimalIds error:', e)
    return { success: false, error: '개체 목록 조회 중 오류가 발생했습니다.' }
  }
}
