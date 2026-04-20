'use server'

import { getAllTenantsService } from '@/services/tenant-service'

export async function getTenants() {
  return await getAllTenantsService()
}
