'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { setTenantSpecies } from '@/services/tenant-code-service'
import { z } from 'zod'

const setTenantSpeciesSchema = z.object({
  speciesIds: z.array(z.string()),
})

export async function setTenantSpeciesAction(data: z.infer<typeof setTenantSpeciesSchema>) {
  try {
    const validated = setTenantSpeciesSchema.parse(data)

    const userResult = await getCurrentUserService()

    if (!userResult.success || !userResult.data) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const user = userResult.data

    if (!user.tenantId) {
      return { success: false, error: '테넌트 정보를 찾을 수 없습니다.' }
    }

    await setTenantSpecies(user.tenantId, validated.speciesIds)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Failed to set tenant species:', error)
    return { success: false, error: '종 설정 저장에 실패했습니다.' }
  }
}
