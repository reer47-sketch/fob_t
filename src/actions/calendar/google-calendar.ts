'use server'

import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

async function getAuthedClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  })
  if (!user?.googleAccessToken) return null

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken ?? undefined,
    expiry_date: user.googleTokenExpiry?.getTime(),
  })

  // 토큰 만료 시 자동 갱신 후 DB 저장
  oauth2Client.on('tokens', async (tokens) => {
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token ?? undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })
  })

  return oauth2Client
}

export async function getGoogleCalendarStatus(): Promise<{ connected: boolean }> {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { connected: false }
  const user = await prisma.user.findUnique({
    where: { id: session.data.id },
    select: { googleAccessToken: true },
  })
  return { connected: !!user?.googleAccessToken }
}

export async function disconnectGoogleCalendar() {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false }
  await prisma.user.update({
    where: { id: session.data.id },
    data: { googleAccessToken: null, googleRefreshToken: null, googleTokenExpiry: null },
  })
  return { success: true }
}

// 예정 이벤트(부화 예정일, 태스크)를 Google Calendar에 동기화
export async function syncToGoogleCalendar(opts: {
  from: Date
  to: Date
}) {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }

  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  const authClient = await getAuthedClient(session.data.id)
  if (!authClient) return { success: false, error: 'Google Calendar 연동이 필요합니다.' }

  const calendar = google.calendar({ version: 'v3', auth: authClient })

  let synced = 0

  try {
    // 1. 부화 예정 이벤트 동기화
    const eggs = await prisma.egg.findMany({
      where: {
        status: 'INCUBATING',
        expectedHatchDate: { gte: opts.from, lte: opts.to },
        female: { tenantId },
      },
      include: {
        female: { select: { name: true, uniqueId: true } },
        male: { select: { name: true } },
      },
    })

    for (const egg of eggs) {
      const dateStr = egg.expectedHatchDate!.toISOString().split('T')[0]
      const title = `[부화예정] ${egg.female.name || egg.female.uniqueId}${egg.male ? ' × ' + egg.male.name : ''}`
      const eventBody = {
        summary: title,
        description: 'FOBreeders - 부화 예정일 알림',
        start: { date: dateStr },
        end: { date: dateStr },
        reminders: { useDefault: false, overrides: [{ method: 'popup' as const, minutes: 480 }] },
      }

      if (egg.googleEventId) {
        try {
          await calendar.events.update({ calendarId: 'primary', eventId: egg.googleEventId, requestBody: eventBody })
        } catch {
          const res = await calendar.events.insert({ calendarId: 'primary', requestBody: eventBody })
          await prisma.egg.update({ where: { id: egg.id }, data: { googleEventId: res.data.id } })
        }
      } else {
        const res = await calendar.events.insert({ calendarId: 'primary', requestBody: eventBody })
        await prisma.egg.update({ where: { id: egg.id }, data: { googleEventId: res.data.id } })
      }
      synced++
    }

    // 2. 태스크 동기화
    const tasks = await prisma.calendarTask.findMany({
      where: { tenantId, completed: false, date: { gte: opts.from, lte: opts.to } },
    })

    const categoryLabel: Record<string, string> = {
      CLEANING: '청소', RACK_SETUP: '렉사설치', FEEDING_PREP: '먹이준비', HEALTH_CHECK: '건강체크', OTHER: '기타',
    }

    for (const task of tasks) {
      const dateStr = task.date.toISOString().split('T')[0]
      const eventBody = {
        summary: `[FOB] ${task.title}`,
        description: `${categoryLabel[task.category] || ''} ${task.memo || ''}`.trim(),
        start: { date: dateStr },
        end: { date: dateStr },
        reminders: { useDefault: false, overrides: [{ method: 'popup' as const, minutes: 30 }] },
      }

      if (task.googleEventId) {
        try {
          await calendar.events.update({ calendarId: 'primary', eventId: task.googleEventId, requestBody: eventBody })
        } catch {
          const res = await calendar.events.insert({ calendarId: 'primary', requestBody: eventBody })
          await prisma.calendarTask.update({ where: { id: task.id }, data: { googleEventId: res.data.id } })
        }
      } else {
        const res = await calendar.events.insert({ calendarId: 'primary', requestBody: eventBody })
        await prisma.calendarTask.update({ where: { id: task.id }, data: { googleEventId: res.data.id } })
      }
      synced++
    }

    return { success: true, synced }
  } catch (e) {
    console.error('syncToGoogleCalendar error:', e)
    return { success: false, error: 'Google Calendar 동기화 중 오류가 발생했습니다.' }
  }
}
