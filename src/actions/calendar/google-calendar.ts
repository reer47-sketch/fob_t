'use server'

import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { startOfDay, endOfDay } from 'date-fns'

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

// prefix와 id 모두 hex 인코딩 → 0-9a-f만 사용 (Google Calendar 허용 범위)
function toGCalEventId(prefix: string, id: string): string {
  const prefixHex = Buffer.from(prefix).toString('hex')
  const idHex = Buffer.from(id).toString('hex')
  return (prefixHex + idHex).slice(0, 1024)
}

// 이벤트 upsert: 404면 생성, 그 외 에러는 그대로 전파
async function upsertEvent(
  calendar: ReturnType<typeof google.calendar>,
  eventId: string,
  eventBody: object,
) {
  try {
    await calendar.events.patch({ calendarId: 'primary', eventId, requestBody: eventBody })
  } catch (e: unknown) {
    const status = (e as { code?: number })?.code
    if (status === 404 || status === 410) {
      await calendar.events.insert({ calendarId: 'primary', requestBody: { ...eventBody, id: eventId } })
    } else {
      throw e
    }
  }
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

export async function syncToGoogleCalendar(opts: { from: Date; to: Date }) {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }

  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  const authClient = await getAuthedClient(session.data.id)
  if (!authClient) return { success: false, error: 'Google Calendar 연동이 필요합니다.' }

  const calendar = google.calendar({ version: 'v3', auth: authClient })

  const fromDate = startOfDay(opts.from)
  const toDate = endOfDay(opts.to)
  let synced = 0

  try {
    const [animals, matings, layings, hatchings, expectedHatchings, tasks] = await Promise.all([
      // 신규 등록 개체 (입양/해칭)
      prisma.animal.findMany({
        where: { tenantId, isDel: false, acquisitionDate: { gte: fromDate, lte: toDate } },
        select: { id: true, name: true, uniqueId: true, acquisitionType: true, acquisitionDate: true },
      }),
      // 메이팅
      prisma.pairing.findMany({
        where: { tenantId, date: { gte: fromDate, lte: toDate } },
        select: {
          id: true, date: true,
          female: { select: { name: true, uniqueId: true } },
          male: { select: { name: true, uniqueId: true } },
        },
      }),
      // 산란
      prisma.egg.findMany({
        where: { layDate: { gte: fromDate, lte: toDate }, female: { tenantId } },
        select: {
          id: true, layDate: true,
          female: { select: { name: true, uniqueId: true } },
          male: { select: { name: true } },
        },
      }),
      // 부화
      prisma.egg.findMany({
        where: { hatchDate: { gte: fromDate, lte: toDate }, female: { tenantId } },
        select: {
          id: true, hatchDate: true,
          female: { select: { name: true, uniqueId: true } },
          male: { select: { name: true } },
        },
      }),
      // 부화 예정
      prisma.egg.findMany({
        where: { status: 'INCUBATING', expectedHatchDate: { gte: fromDate, lte: toDate }, female: { tenantId } },
        select: {
          id: true, expectedHatchDate: true, googleEventId: true,
          female: { select: { name: true, uniqueId: true } },
          male: { select: { name: true } },
        },
      }),
      // 태스크
      prisma.calendarTask.findMany({
        where: { tenantId, completed: false, date: { gte: fromDate, lte: toDate } },
      }),
    ])

    const toDateStr = (d: Date) => d.toISOString().split('T')[0]

    // 1. 신규 등록 개체
    for (const a of animals) {
      const dateStr = toDateStr(a.acquisitionDate)
      const typeLabel = a.acquisitionType === 'HATCHING' ? '해칭' : '입양'
      const eventId = toGCalEventId('fobaniml', a.id)
      await upsertEvent(calendar, eventId, {
        summary: `[FOB] ${typeLabel} - ${a.name || a.uniqueId}`,
        description: `FOBreeders - ${typeLabel} 등록`,
        start: { date: dateStr },
        end: { date: dateStr },
      })
      synced++
    }

    // 2. 메이팅
    for (const m of matings) {
      const dateStr = toDateStr(m.date)
      const eventId = toGCalEventId('fobmating', m.id)
      await upsertEvent(calendar, eventId, {
        summary: `[FOB] 메이팅 - ${m.female.name || m.female.uniqueId} × ${m.male.name || m.male.uniqueId}`,
        description: 'FOBreeders - 메이팅 기록',
        start: { date: dateStr },
        end: { date: dateStr },
      })
      synced++
    }

    // 3. 산란
    for (const e of layings) {
      const dateStr = toDateStr(e.layDate)
      const eventId = toGCalEventId('foblaying', e.id)
      await upsertEvent(calendar, eventId, {
        summary: `[FOB] 산란 - ${e.female.name || e.female.uniqueId}${e.male ? ' × ' + e.male.name : ''}`,
        description: 'FOBreeders - 산란 기록',
        start: { date: dateStr },
        end: { date: dateStr },
      })
      synced++
    }

    // 4. 부화
    for (const e of hatchings) {
      const dateStr = toDateStr(e.hatchDate!)
      const eventId = toGCalEventId('fobhatch', e.id)
      await upsertEvent(calendar, eventId, {
        summary: `[FOB] 부화 - ${e.female.name || e.female.uniqueId}${e.male ? ' × ' + e.male.name : ''}`,
        description: 'FOBreeders - 부화 기록',
        start: { date: dateStr },
        end: { date: dateStr },
      })
      synced++
    }

    // 5. 부화 예정 (알림 포함)
    for (const egg of expectedHatchings) {
      const dateStr = toDateStr(egg.expectedHatchDate!)
      const title = `[FOB] 부화예정 - ${egg.female.name || egg.female.uniqueId}${egg.male ? ' × ' + egg.male.name : ''}`
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

    // 6. 태스크 (알림 포함)
    const categoryLabel: Record<string, string> = {
      CLEANING: '청소', RACK_SETUP: '렉사설치', FEEDING_PREP: '먹이준비', HEALTH_CHECK: '건강체크', OTHER: '기타',
    }
    for (const task of tasks) {
      const dateStr = toDateStr(task.date)
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
