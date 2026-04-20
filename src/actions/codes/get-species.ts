'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { getAllSpecies, getSpeciesForTenant } from '@/services/code-service'

export async function getSpeciesAction() {
  try {
    const userResult = await getCurrentUserService()

    if (!userResult.success || !userResult.data) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const user = userResult.data

    // ADMIN: 전체 종 목록
    if (user.role === 'ADMIN') {
      const species = await getAllSpecies()
      return { success: true, data: species }
    }

    // BREEDER: 테넌트에 설정된 종만
    if (!user.tenantId) {
      return { success: false, error: '테넌트 정보를 찾을 수 없습니다.' }
    }

    const species = await getSpeciesForTenant(user.tenantId)
    return { success: true, data: species }
  } catch (error) {
    console.error('Failed to fetch species:', error)
    return { success: false, error: 'Failed to fetch species' }
  }
}
