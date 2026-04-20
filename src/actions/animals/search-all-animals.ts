'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { searchAllAnimalsService } from '@/services/animal-service'

export async function searchAllAnimals(
  searchTerm: string,
  excludeAnimalId?: string,
  gender?: 'MALE' | 'FEMALE'
) {
  const session = await getCurrentUserService()

  if (!session?.success || !session.data) {
    return { success: false, error: 'Unauthorized' }
  }

  const tenantId = session.data.tenantId
  if (!tenantId) {
    return { success: false, error: 'Tenant not found' }
  }

  return searchAllAnimalsService(tenantId, searchTerm, excludeAnimalId, gender)
}
