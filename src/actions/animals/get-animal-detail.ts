'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { getAnimalDetailService } from '@/services/animal-service'


export async function getAnimalDetail(animalId: string) {
  const session = await getCurrentUserService()

  if (!session?.success || !session.data) {
    return { success: false, error: 'Unauthorized' }
  }

  const tenantId = session.data.tenantId
  if (!tenantId) {
    return { success: false, error: 'Tenant not found' }
  }

  return getAnimalDetailService(animalId, tenantId)
}
