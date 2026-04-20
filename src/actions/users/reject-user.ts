'use server'

import { rejectUserSchema, type RejectUserInput } from './schemas'
import { rejectUserService } from '@/services/user-service'
import { getCurrentUserService } from '@/services/auth-service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * 사용자 거부 Action (관리자 전용)
 */
export async function rejectUser(input: RejectUserInput) {
  try {
    // 1. Validation
    const validated = rejectUserSchema.parse(input)

    // 2. Authorization (관리자만 가능)
    const currentUser = await getCurrentUserService()
    if (!currentUser.success || currentUser.data?.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    // 3. Business Logic (Service로 위임)
    const result = await rejectUserService({
      userId: validated.userId,
      reason: validated.reason,
    })

    // 4. Cache Revalidation
    if (result.success) {
      revalidatePath('/admin/pending-users')
      revalidatePath('/admin/users')
    }

    return result
  } catch (error) {
    console.error('rejectUser action error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Failed to reject user' }
  }
}
