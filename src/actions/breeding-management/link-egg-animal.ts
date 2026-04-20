'use server'

import { linkEggAnimalSchema, type LinkEggAnimalInput } from './schemas'
import { linkEggAnimalService } from '@/services/breeding-management-service'
import { getCurrentUserService } from '@/services/auth-service'

export async function linkEggAnimal(input: LinkEggAnimalInput) {
  try {
    const validated = linkEggAnimalSchema.parse(input)

    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data?.tenantId) {
      return { success: false as const, error: '로그인이 필요합니다' }
    }

    return await linkEggAnimalService(validated, userResult.data.tenantId)
  } catch (error) {
    console.error('linkEggAnimal error:', error)
    return { success: false as const, error: '알-개체 연결 실패' }
  }
}
