'use server'

import { getUsersFilterSchema, type GetUsersFilterInput } from './schemas'
import { getAllUsersService } from '@/services/user-service'
import { getCurrentUserService } from '@/services/auth-service'
import { z } from 'zod'

/**
 * 전체 사용자 목록 조회 (관리자 전용)
 */
export async function getAllUsers(filters?: GetUsersFilterInput) {
  try {
    // 1. Validation
    const validated = filters ? getUsersFilterSchema.parse(filters) : undefined

    // 2. Authorization (관리자만 가능)
    const currentUser = await getCurrentUserService()
    if (!currentUser.success || currentUser.data?.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    // 3. Business Logic (Service로 위임)
    return await getAllUsersService(validated)
  } catch (error) {
    console.error('getAllUsers action error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Failed to fetch users' }
  }
}
