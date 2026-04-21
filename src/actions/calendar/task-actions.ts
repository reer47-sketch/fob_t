'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { revalidatePath } from 'next/cache'
import { TaskCategory } from '@prisma/client'

export async function createCalendarTask(data: {
  title: string
  date: Date
  category: TaskCategory
  memo?: string
}) {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }
  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  try {
    const task = await prisma.calendarTask.create({
      data: { tenantId, title: data.title, date: data.date, category: data.category, memo: data.memo },
    })
    revalidatePath('/calendar')
    return { success: true, data: task }
  } catch (e) {
    console.error('createCalendarTask error:', e)
    return { success: false, error: '태스크 생성 중 오류가 발생했습니다.' }
  }
}

export async function updateCalendarTask(id: string, data: {
  title?: string
  date?: Date
  category?: TaskCategory
  memo?: string
  completed?: boolean
  googleEventId?: string | null
}) {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }
  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  try {
    const task = await prisma.calendarTask.update({
      where: { id, tenantId },
      data,
    })
    revalidatePath('/calendar')
    return { success: true, data: task }
  } catch (e) {
    console.error('updateCalendarTask error:', e)
    return { success: false, error: '태스크 수정 중 오류가 발생했습니다.' }
  }
}

export async function deleteCalendarTask(id: string) {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }
  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  try {
    await prisma.calendarTask.delete({ where: { id, tenantId } })
    revalidatePath('/calendar')
    return { success: true }
  } catch (e) {
    console.error('deleteCalendarTask error:', e)
    return { success: false, error: '태스크 삭제 중 오류가 발생했습니다.' }
  }
}

export async function toggleCalendarTask(id: string, completed: boolean) {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }
  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  try {
    await prisma.calendarTask.update({ where: { id, tenantId }, data: { completed } })
    revalidatePath('/calendar')
    return { success: true }
  } catch (e) {
    return { success: false, error: '태스크 상태 변경 중 오류가 발생했습니다.' }
  }
}
