'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { addDays, startOfDay, endOfDay, subDays } from 'date-fns'

export interface WeeklyReportData {
  generatedAt: string
  weekStart: string
  weekEnd: string
  expectedHatchings: {
    eggId: string
    expectedDate: string
    femaleName: string | null
    femaleUniqueId: string
    maleName: string | null
    clutchCount: number
  }[]
  layingSoon: {
    pairingId: string
    femaleName: string | null
    femaleUniqueId: string
    maleName: string | null
    maleUniqueId: string
    matingDate: string
  }[]
  activeMating: {
    pairingId: string
    femaleName: string | null
    femaleUniqueId: string
    maleName: string | null
    maleUniqueId: string
    matingDate: string
    status: string
  }[]
  tasks: {
    id: string
    title: string
    date: string
    category: string
    memo: string | null
  }[]
  unfedAnimals: {
    id: string
    name: string | null
    uniqueId: string
    daysSinceFeeding: number
  }[]
}

const CATEGORY_LABEL: Record<string, string> = {
  CLEANING: '사육장 청소',
  RACK_SETUP: '렉사 설치',
  FEEDING_PREP: '먹이 준비',
  HEALTH_CHECK: '건강 체크',
  OTHER: '기타',
}

const STATUS_LABEL: Record<string, string> = {
  WAITING: '메이팅 대기',
  MATING: '메이팅 중',
  LAYING_SOON: '산란 임박',
}

export async function getWeeklyReport(): Promise<{ success: boolean; data?: WeeklyReportData; error?: string }> {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }

  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  const now = new Date()
  const weekStart = startOfDay(now)
  const weekEnd = endOfDay(addDays(now, 6))
  const toDateStr = (d: Date) => d.toISOString().split('T')[0]

  try {
    const [expectedHatchEggs, activePairings, tasks, allAnimals, recentFeedings] = await Promise.all([
      // 이번 주 부화 예정
      prisma.egg.findMany({
        where: {
          status: 'INCUBATING',
          expectedHatchDate: { gte: weekStart, lte: weekEnd },
          female: { tenantId },
        },
        include: {
          female: { select: { name: true, uniqueId: true } },
          male: { select: { name: true } },
          _count: { select: { eggs: false } },
        },
        orderBy: { expectedHatchDate: 'asc' },
      }),

      // 진행 중인 메이팅 (대기/메이팅 중/산란 임박)
      prisma.pairing.findMany({
        where: {
          tenantId,
          status: { in: ['WAITING', 'MATING', 'LAYING_SOON'] },
        },
        include: {
          female: { select: { name: true, uniqueId: true } },
          male: { select: { name: true, uniqueId: true } },
        },
        orderBy: { date: 'desc' },
      }),

      // 이번 주 미완료 태스크
      prisma.calendarTask.findMany({
        where: {
          tenantId,
          completed: false,
          date: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { date: 'asc' },
      }),

      // 전체 생존 개체
      prisma.animal.findMany({
        where: { tenantId, isDel: false, deathDate: null },
        select: { id: true, name: true, uniqueId: true },
      }),

      // 최근 피딩 (7일)
      prisma.feeding.findMany({
        where: {
          animal: { tenantId },
          feedingDate: { gte: subDays(now, 7) },
        },
        select: { animalId: true, feedingDate: true },
        orderBy: { feedingDate: 'desc' },
      }),
    ])

    // 부화 예정 — 같은 날/같은 암컷 클러치 수 계산
    const expectedHatchings = expectedHatchEggs.map(e => ({
      eggId: e.id,
      expectedDate: toDateStr(e.expectedHatchDate!),
      femaleName: e.female.name,
      femaleUniqueId: e.female.uniqueId,
      maleName: e.male?.name ?? null,
      clutchCount: 1,
    }))

    // 메이팅 상태별 분리
    const layingSoon = activePairings
      .filter(p => p.status === 'LAYING_SOON')
      .map(p => ({
        pairingId: p.id,
        femaleName: p.female.name,
        femaleUniqueId: p.female.uniqueId,
        maleName: p.male.name,
        maleUniqueId: p.male.uniqueId,
        matingDate: toDateStr(p.date),
      }))

    const activeMating = activePairings
      .filter(p => p.status === 'WAITING' || p.status === 'MATING')
      .map(p => ({
        pairingId: p.id,
        femaleName: p.female.name,
        femaleUniqueId: p.female.uniqueId,
        maleName: p.male.name,
        maleUniqueId: p.male.uniqueId,
        matingDate: toDateStr(p.date),
        status: STATUS_LABEL[p.status] ?? p.status,
      }))

    // 태스크
    const taskList = tasks.map(t => ({
      id: t.id,
      title: t.title,
      date: toDateStr(t.date),
      category: CATEGORY_LABEL[t.category] ?? t.category,
      memo: t.memo,
    }))

    // 미피딩 개체
    const lastFedMap = new Map<string, Date>()
    for (const f of recentFeedings) {
      if (!lastFedMap.has(f.animalId)) lastFedMap.set(f.animalId, f.feedingDate)
    }
    const unfedAnimals = allAnimals
      .map(a => {
        const lastFed = lastFedMap.get(a.id)
        const daysSince = lastFed
          ? Math.floor((now.getTime() - lastFed.getTime()) / (1000 * 60 * 60 * 24))
          : 999
        return { ...a, daysSinceFeeding: daysSince }
      })
      .filter(a => a.daysSinceFeeding >= 7)
      .sort((a, b) => b.daysSinceFeeding - a.daysSinceFeeding)

    return {
      success: true,
      data: {
        generatedAt: now.toISOString(),
        weekStart: toDateStr(weekStart),
        weekEnd: toDateStr(weekEnd),
        expectedHatchings,
        layingSoon,
        activeMating,
        tasks: taskList,
        unfedAnimals,
      },
    }
  } catch (e) {
    console.error('getWeeklyReport error:', e)
    return { success: false, error: '주간 리포트 조회 중 오류가 발생했습니다.' }
  }
}
