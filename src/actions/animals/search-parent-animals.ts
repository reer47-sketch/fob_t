'use server'

import { getCurrentUserService } from '@/services/auth-service'
import { searchParentAnimalsService } from '@/services/animal-service'

export async function searchParentAnimals(
  searchTerm: string,
  gender: 'MALE' | 'FEMALE',
  excludeAnimalId?: string
) {
  const session = await getCurrentUserService()

  if (!session?.success || !session.data) {
    return { success: false, error: 'Unauthorized' }
  }

  const tenantId = session.data.tenantId
  if (!tenantId) {
    return { success: false, error: 'Tenant not found' }
  }

  return searchParentAnimalsService(tenantId, searchTerm, gender, excludeAnimalId)
}
