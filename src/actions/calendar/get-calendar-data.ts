'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserService } from '@/services/auth-service'
import { startOfDay, endOfDay, subDays } from 'date-fns'

export interface CalendarAnimal {
  id: string
  name: string | null
  uniqueId: string
  acquisitionType: string
}

export interface CalendarSale {
  id: string
  animalName: string | null
  animalUniqueId: string
  price: number
  customerName: string | null
}

export interface CalendarDeath {
  id: string
  name: string | null
  uniqueId: string
}

export interface CalendarMating {
  pairingId: string
  femaleName: string | null
  femaleUniqueId: string
  maleName: string | null
  maleUniqueId: string
  date: string
}

export interface CalendarLaying {
  eggId: string
  femaleName: string | null
  femaleUniqueId: string
  maleName: string | null
  maleUniqueId: string | null
  pairingId: string | null
  count: number
  layDate: string
}

export interface CalendarHatching {
  eggId: string
  femaleName: string | null
  femaleUniqueId: string
  maleName: string | null
  maleUniqueId: string | null
  hatchDate: string
  hasAnimal: boolean
}

export interface CalendarExpectedHatch {
  eggId: string
  femaleName: string | null
  femaleUniqueId: string
  maleName: string | null
  expectedHatchDate: string
  googleEventId: string | null
}

export interface CalendarTask {
  id: string
  title: string
  date: string
  completed: boolean
  category: string
  memo: string | null
  googleEventId: string | null
}

export interface UnfedAnimal {
  id: string
  name: string | null
  uniqueId: string
  lastFedDate: string | null
  daysSinceFeeding: number
}

export interface CalendarDayData {
  date: string
  newAnimals: CalendarAnimal[]
  sales: CalendarSale[]
  deaths: CalendarDeath[]
  matings: CalendarMating[]
  layings: CalendarLaying[]
  hatchings: CalendarHatching[]
  expectedHatchings: CalendarExpectedHatch[]
  tasks: CalendarTask[]
}

export interface CalendarDataResult {
  days: Record<string, CalendarDayData>
  unfedAnimals: UnfedAnimal[]
}

export async function getCalendarData(from: Date, to: Date): Promise<{ success: boolean; data?: CalendarDataResult; error?: string }> {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) return { success: false, error: 'Unauthorized' }

  const tenantId = session.data.tenantId
  if (!tenantId) return { success: false, error: 'Tenant not found' }

  const fromDate = startOfDay(from)
  const toDate = endOfDay(to)

  try {
    const [
      newAnimals,
      sales,
      deaths,
      matings,
      layings,
      hatchings,
      expectedHatchings,
      tasks,
      allAnimals,
      recentFeedings,
    ] = await Promise.all([
      // 1. 신규 등록 개체 (입양/해칭)
      prisma.animal.findMany({
        where: { tenantId, isDel: false, acquisitionDate: { gte: fromDate, lte: toDate } },
        select: { id: true, name: true, uniqueId: true, acquisitionType: true, acquisitionDate: true },
      }),

      // 2. 판매 내역
      prisma.adoption.findMany({
        where: { adoptionDate: { gte: fromDate, lte: toDate }, animal: { tenantId } },
        select: {
          id: true,
          adoptionDate: true,
          price: true,
          animal: { select: { id: true, name: true, uniqueId: true } },
          customer: { select: { name: true } },
        },
      }),

      // 2-2. 폐사 개체
      prisma.animal.findMany({
        where: { tenantId, isDel: false, deathDate: { gte: fromDate, lte: toDate } },
        select: { id: true, name: true, uniqueId: true, deathDate: true },
      }),

      // 3. 메이팅 기록
      prisma.pairing.findMany({
        where: { tenantId, date: { gte: fromDate, lte: toDate } },
        select: {
          id: true,
          date: true,
          female: { select: { id: true, name: true, uniqueId: true } },
          male: { select: { id: true, name: true, uniqueId: true } },
        },
      }),

      // 4. 산란 기록 (Egg별, 같은 날 같은 페어는 클러치로 묶음)
      prisma.egg.findMany({
        where: { layDate: { gte: fromDate, lte: toDate }, female: { tenantId } },
        select: {
          id: true,
          layDate: true,
          pairingId: true,
          female: { select: { id: true, name: true, uniqueId: true } },
          male: { select: { id: true, name: true, uniqueId: true } },
        },
      }),

      // 5/6. 부화 기록
      prisma.egg.findMany({
        where: { hatchDate: { gte: fromDate, lte: toDate }, female: { tenantId } },
        select: {
          id: true,
          hatchDate: true,
          hatchedAnimalId: true,
          female: { select: { id: true, name: true, uniqueId: true } },
          male: { select: { id: true, name: true, uniqueId: true } },
        },
      }),

      // 6-1. 부화 예정
      prisma.egg.findMany({
        where: {
          expectedHatchDate: { gte: fromDate, lte: toDate },
          status: 'INCUBATING',
          female: { tenantId },
        },
        select: {
          id: true,
          expectedHatchDate: true,
          googleEventId: true,
          female: { select: { id: true, name: true, uniqueId: true } },
          male: { select: { id: true, name: true, uniqueId: true } },
        },
      }),

      // 9. 태스크
      prisma.calendarTask.findMany({
        where: { tenantId, date: { gte: fromDate, lte: toDate } },
        select: { id: true, title: true, date: true, completed: true, category: true, memo: true, googleEventId: true },
        orderBy: { date: 'asc' },
      }),

      // 8. 피딩 미기록 계산용 - 모든 살아있는 개체
      prisma.animal.findMany({
        where: { tenantId, isDel: false, deathDate: null },
        select: { id: true, name: true, uniqueId: true },
      }),

      // 8. 최근 피딩 기록 (7일 이내)
      prisma.feeding.findMany({
        where: {
          animal: { tenantId },
          feedingDate: { gte: subDays(new Date(), 7) },
        },
        select: { animalId: true, feedingDate: true },
        orderBy: { feedingDate: 'desc' },
      }),
    ])

    // 날짜별로 데이터 그룹화
    const days: Record<string, CalendarDayData> = {}

    const getOrCreate = (dateStr: string): CalendarDayData => {
      if (!days[dateStr]) {
        days[dateStr] = { date: dateStr, newAnimals: [], sales: [], deaths: [], matings: [], layings: [], hatchings: [], expectedHatchings: [], tasks: [] }
      }
      return days[dateStr]
    }

    const toDateStr = (d: Date) => d.toISOString().split('T')[0]

    // 신규 등록
    for (const a of newAnimals) {
      getOrCreate(toDateStr(a.acquisitionDate)).newAnimals.push({
        id: a.id, name: a.name, uniqueId: a.uniqueId, acquisitionType: a.acquisitionType,
      })
    }

    // 판매
    for (const s of sales) {
      getOrCreate(toDateStr(s.adoptionDate)).sales.push({
        id: s.id,
        animalName: s.animal.name,
        animalUniqueId: s.animal.uniqueId,
        price: s.price,
        customerName: s.customer?.name ?? null,
      })
    }

    // 폐사
    for (const d of deaths) {
      getOrCreate(toDateStr(d.deathDate!)).deaths.push({ id: d.id, name: d.name, uniqueId: d.uniqueId })
    }

    // 메이팅
    for (const m of matings) {
      getOrCreate(toDateStr(m.date)).matings.push({
        pairingId: m.id,
        femaleName: m.female.name,
        femaleUniqueId: m.female.uniqueId,
        maleName: m.male.name,
        maleUniqueId: m.male.uniqueId,
        date: toDateStr(m.date),
      })
    }

    // 산란 (같은 날, 같은 암컷 기준으로 묶기)
    const layingGroups: Record<string, { eggId: string; count: number; femaleName: string | null; femaleUniqueId: string; maleName: string | null; maleUniqueId: string | null; pairingId: string | null; layDate: string }> = {}
    for (const e of layings) {
      const key = `${toDateStr(e.layDate)}_${e.female.id}`
      if (!layingGroups[key]) {
        layingGroups[key] = {
          eggId: e.id,
          count: 0,
          femaleName: e.female.name,
          femaleUniqueId: e.female.uniqueId,
          maleName: e.male?.name ?? null,
          maleUniqueId: e.male?.id ?? null,
          pairingId: e.pairingId,
          layDate: toDateStr(e.layDate),
        }
      }
      layingGroups[key].count++
    }
    for (const g of Object.values(layingGroups)) {
      getOrCreate(g.layDate).layings.push(g)
    }

    // 부화
    for (const e of hatchings) {
      getOrCreate(toDateStr(e.hatchDate!)).hatchings.push({
        eggId: e.id,
        femaleName: e.female.name,
        femaleUniqueId: e.female.uniqueId,
        maleName: e.male?.name ?? null,
        maleUniqueId: e.male?.id ?? null,
        hatchDate: toDateStr(e.hatchDate!),
        hasAnimal: !!e.hatchedAnimalId,
      })
    }

    // 부화 예정
    for (const e of expectedHatchings) {
      getOrCreate(toDateStr(e.expectedHatchDate!)).expectedHatchings.push({
        eggId: e.id,
        femaleName: e.female.name,
        femaleUniqueId: e.female.uniqueId,
        maleName: e.male?.name ?? null,
        expectedHatchDate: toDateStr(e.expectedHatchDate!),
        googleEventId: e.googleEventId,
      })
    }

    // 태스크
    for (const t of tasks) {
      getOrCreate(toDateStr(t.date)).tasks.push({
        id: t.id,
        title: t.title,
        date: toDateStr(t.date),
        completed: t.completed,
        category: t.category,
        memo: t.memo,
        googleEventId: t.googleEventId,
      })
    }

    // 8. 피딩 미기록 개체 계산 (7일 이상)
    const lastFedMap = new Map<string, Date>()
    for (const f of recentFeedings) {
      if (!lastFedMap.has(f.animalId)) lastFedMap.set(f.animalId, f.feedingDate)
    }
    const now = new Date()
    const unfedAnimals: UnfedAnimal[] = allAnimals
      .map(a => {
        const lastFed = lastFedMap.get(a.id)
        const daysSince = lastFed ? Math.floor((now.getTime() - lastFed.getTime()) / (1000 * 60 * 60 * 24)) : 999
        return { id: a.id, name: a.name, uniqueId: a.uniqueId, lastFedDate: lastFed ? toDateStr(lastFed) : null, daysSinceFeeding: daysSince }
      })
      .filter(a => a.daysSinceFeeding >= 7)
      .sort((a, b) => b.daysSinceFeeding - a.daysSinceFeeding)

    return { success: true, data: { days, unfedAnimals } }
  } catch (e) {
    console.error('getCalendarData error:', e)
    return { success: false, error: '캘린더 데이터 조회 중 오류가 발생했습니다.' }
  }
}
