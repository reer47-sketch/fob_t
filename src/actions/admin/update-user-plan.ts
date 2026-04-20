'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/actions/auth/get-current-user'
import { UserPlan } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function updateUserPlan(userId: string, plan: UserPlan) {
  const currentUser = await getCurrentUser()

  if (!currentUser.success || !currentUser.data) {
    return { success: false, error: 'Unauthorized' }
  }

  if (currentUser.data.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        planUpdatedAt: new Date(),
      },
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to update user plan:', error)
    return { success: false, error: '플랜 변경에 실패했습니다.' }
  }
}
