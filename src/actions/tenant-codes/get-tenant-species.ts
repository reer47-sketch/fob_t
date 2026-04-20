'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { getAllSpeciesWithTenantSelection } from '@/services/tenant-code-service'

export async function getTenantSpeciesAction() {
  try {
    const userResult = await getCurrentUserService()

    if (!userResult.success || !userResult.data) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const user = userResult.data

    if (!user.tenantId) {
      return { success: false, error: '테넌트 정보를 찾을 수 없습니다.' }
    }

    const data = await getAllSpeciesWithTenantSelection(user.tenantId)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to fetch tenant species:', error)
    return { success: false, error: '종 설정 조회에 실패했습니다.' }
  }
}
