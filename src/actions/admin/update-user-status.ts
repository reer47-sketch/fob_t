'use server'

import { updateUserStatusService } from '@/services/user-service'
import { getCurrentUser } from '@/actions/auth/get-current-user'

export async function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'DELETED'
) {
  // 관리자 권한 체크
  const currentUser = await getCurrentUser()

  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: 'Unauthorized' }
  }

  if (currentUser.data.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' }
  }

  return await updateUserStatusService(userId, status, currentUser.data.id)
}
