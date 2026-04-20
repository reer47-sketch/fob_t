'use server'

import { getPendingUsersService } from '@/services/user-service'
import { getCurrentUserService } from '@/services/auth-service'

/**
 * 승인 대기 중인 사용자 목록 조회 (관리자 전용)
 */
export async function getPendingUsers() {
  try {
    // Authorization (관리자만 가능)
    const currentUser = await getCurrentUserService()
    if (!currentUser.success || currentUser.data?.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    // Business Logic (Service로 위임)
    return await getPendingUsersService()
  } catch (error) {
    console.error('getPendingUsers action error:', error)
    return { success: false, error: 'Failed to fetch pending users' }
  }
}
