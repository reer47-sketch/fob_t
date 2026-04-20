// ============ 타입 정의 ============

export type Gender = 'MALE' | 'FEMALE'

export type PairingStatus = 'WAITING' | 'MATING' | 'LAYING_SOON' | 'LAID' | 'DONE' | 'COOLING'
export type EggStatus = 'INCUBATING' | 'HATCHED' | 'FAILED'

export interface BreedingAnimal {
  id: string
  name: string
  uniqueId: string
  gender: Gender
  morph: string
  imageUrl?: string
  hatchDate?: string
}

export interface Zone {
  id: string
  name: string
  description?: string
  order: number
}

export interface Rack {
  id: string
  zoneId: string
  name: string
  rows: number
  cols: number
  order: number
}

export interface RackCell {
  id: string
  rackId: string
  row: number
  col: number
  animalId?: string
}

export interface Pairing {
  id: string
  maleIds: string[] // 최대 2
  femaleId: string
  date: string // ISO date
  status: PairingStatus
  memo?: string
}

export interface TemperatureLog {
  temp: number
  startDate: string // ISO date
}

export interface Egg {
  id: string
  pairingId: string
  femaleId: string
  layDate: string // ISO date
  /** 캔들링 확인 완료 여부 */
  checked: boolean
  /** 유정 여부: true=유정, false=무정, null=미확인 */
  fertile: boolean | null
  temperatureLogs: TemperatureLog[]
  humidity?: number
  substrate?: string
  status: EggStatus
  hatchDate?: string
  memo?: string
}

// ============ 부화 공식 ============

interface TempRange {
  temp: number
  min: number
  max: number
  label: string
}

const TEMP_RANGE_TABLE: TempRange[] = [
  { temp: 20, min: 90, max: 120, label: '부화 지연, 안전하지만 느림' },
  { temp: 22, min: 80, max: 100, label: '평균적인 속도' },
  { temp: 24, min: 70, max: 80, label: '가장 이상적인 범위' },
  { temp: 26, min: 60, max: 70, label: '빠르고 안정적' },
  { temp: 28, min: 50, max: 60, label: '빠르지만 기형 가능성 주의' },
]

/** 특정 온도에서의 부화 일수 범위 + 상태 라벨 (보간법, 20~28°C) */
export function getHatchDaysRange(tempC: number): { min: number; max: number; label: string } {
  const table = TEMP_RANGE_TABLE
  // 경계 처리
  if (tempC <= table[0].temp) return { min: table[0].min, max: table[0].max, label: table[0].label }
  if (tempC >= table[table.length - 1].temp) return { min: table[table.length - 1].min, max: table[table.length - 1].max, label: table[table.length - 1].label }

  for (let i = 0; i < table.length - 1; i++) {
    const prev = table[i]
    const next = table[i + 1]
    if (tempC >= prev.temp && tempC <= next.temp) {
      const ratio = (tempC - prev.temp) / (next.temp - prev.temp)
      return {
        min: Math.round(prev.min + (next.min - prev.min) * ratio),
        max: Math.round(prev.max + (next.max - prev.max) * ratio),
        label: ratio > 0.5 ? next.label : prev.label,
      }
    }
  }
  return { min: 70, max: 80, label: '가장 이상적인 범위' } // fallback
}

/** 특정 온도에서의 총 필요 일수 (min/max 중간값) */
export function getTotalDaysForTemp(tempC: number): number {
  const range = getHatchDaysRange(tempC)
  return Math.round((range.min + range.max) / 2)
}

/**
 * 온도 변경 이력을 고려한 예상 부화일 계산 (비율 누적법).
 * 예상 부화일은 마지막 온도 변경 시점에 고정되며 today 기준으로 표류하지 않는다.
 * 예정일이 지나면 remainingDays가 음수(D+N) 영역으로 들어간다.
 */
export function calculateHatchInfo(egg: Egg): {
  expectedDateMin: string
  expectedDateMid: string
  expectedDateMax: string
  remainingDays: number
  progress: number // 0~100
  label: string
} {
  const { temperatureLogs, layDate } = egg
  if (temperatureLogs.length === 0) {
    return { expectedDateMin: layDate, expectedDateMid: layDate, expectedDateMax: layDate, remainingDays: 0, progress: 0, label: '' }
  }

  const today = new Date()

  // 마지막 로그 직전까지의 누적 진행도 (마지막 세그먼트는 별도 처리)
  let ratioBeforeLastLog = 0
  for (let i = 0; i < temperatureLogs.length - 1; i++) {
    const log = temperatureLogs[i]
    const next = temperatureLogs[i + 1]
    const totalDays = getTotalDaysForTemp(log.temp)
    const daysAtTemp = Math.max(
      0,
      (new Date(next.startDate).getTime() - new Date(log.startDate).getTime()) / 86400000,
    )
    ratioBeforeLastLog += daysAtTemp / totalDays
  }

  const lastLog = temperatureLogs[temperatureLogs.length - 1]
  const lastTotalDays = getTotalDaysForTemp(lastLog.temp)
  const lastRange = getHatchDaysRange(lastLog.temp)
  const lastStart = new Date(lastLog.startDate)

  // 마지막 세그먼트에서 ratio=1.0까지 남은 비율 (0 이상으로 클램프하지 않음 → 음수 의미 없음)
  const remainingRatio = Math.max(0, 1 - ratioBeforeLastLog)

  const expectedMin = new Date(lastStart)
  expectedMin.setDate(expectedMin.getDate() + Math.round(remainingRatio * lastRange.min))
  const expectedMax = new Date(lastStart)
  expectedMax.setDate(expectedMax.getDate() + Math.round(remainingRatio * lastRange.max))
  const expectedMid = new Date(lastStart)
  expectedMid.setDate(expectedMid.getDate() + Math.round(remainingRatio * lastTotalDays))

  // remainingDays: 오늘부터 예상 부화일(중간값)까지의 일수 (음수 = 경과)
  const remainingDays = Math.round((expectedMid.getTime() - today.getTime()) / 86400000)

  // progress: 오늘 시점의 누적 진행도
  const elapsedInLastSegment = Math.max(0, (today.getTime() - lastStart.getTime()) / 86400000)
  const completedRatio = ratioBeforeLastLog + elapsedInLastSegment / lastTotalDays
  const progress = Math.min(100, Math.round(completedRatio * 100))

  return {
    expectedDateMin: expectedMin.toISOString().slice(0, 10),
    expectedDateMid: expectedMid.toISOString().slice(0, 10),
    expectedDateMax: expectedMax.toISOString().slice(0, 10),
    remainingDays,
    progress,
    label: lastRange.label,
  }
}

// ============ Mock 데이터 ============

export const mockAnimals: BreedingAnimal[] = [
  { id: 'a1', name: 'Zeus', uniqueId: 'CG-M-001', gender: 'MALE', morph: '노말' },
  { id: 'a2', name: 'Apollo', uniqueId: 'CG-M-002', gender: 'MALE', morph: '릴리' },
  { id: 'a3', name: 'Thor', uniqueId: 'CG-M-003', gender: 'MALE', morph: '루왁' },
  { id: 'a4', name: 'Luna', uniqueId: 'CG-F-001', gender: 'FEMALE', morph: '릴리' },
  { id: 'a5', name: 'Stella', uniqueId: 'CG-F-002', gender: 'FEMALE', morph: '노말' },
  { id: 'a6', name: 'Nana', uniqueId: 'CG-F-003', gender: 'FEMALE', morph: '루왁' },
  { id: 'a7', name: 'Momo', uniqueId: 'CG-F-004', gender: 'FEMALE', morph: '노말' },
  { id: 'a8', name: 'Coco', uniqueId: 'CG-F-005', gender: 'FEMALE', morph: '릴리' },
  { id: 'a9', name: 'Hera', uniqueId: 'CG-F-006', gender: 'FEMALE', morph: '루왁' },
  { id: 'a10', name: 'Ares', uniqueId: 'CG-M-004', gender: 'MALE', morph: '노말' },
]

export const mockZones: Zone[] = [
  { id: 'z1', name: 'A', order: 1 },
  { id: 'z2', name: 'B', order: 2 },
]

export const mockRacks: Rack[] = [
  { id: 'r1', zoneId: 'z1', name: '렉사 1', rows: 4, cols: 2, order: 1 },
  { id: 'r2', zoneId: 'z1', name: '렉사 2', rows: 3, cols: 2, order: 2 },
  { id: 'r3', zoneId: 'z2', name: '렉사 3', rows: 4, cols: 3, order: 1 },
]

export const mockCells: RackCell[] = [
  // 렉사1 (4x2)
  { id: 'c1', rackId: 'r1', row: 1, col: 1, animalId: 'a1' },  // Zeus (수컷)
  { id: 'c2', rackId: 'r1', row: 1, col: 2, animalId: 'a4' },  // Luna (암컷)
  { id: 'c3', rackId: 'r1', row: 2, col: 1, animalId: 'a5' },  // Stella
  { id: 'c4', rackId: 'r1', row: 2, col: 2, animalId: undefined },
  { id: 'c5', rackId: 'r1', row: 3, col: 1, animalId: 'a6' },  // Nana
  { id: 'c6', rackId: 'r1', row: 3, col: 2, animalId: 'a7' },  // Momo
  { id: 'c7', rackId: 'r1', row: 4, col: 1, animalId: undefined },
  { id: 'c8', rackId: 'r1', row: 4, col: 2, animalId: undefined },
  // 렉사2 (3x2)
  { id: 'c9', rackId: 'r2', row: 1, col: 1, animalId: 'a2' },   // Apollo (수컷)
  { id: 'c10', rackId: 'r2', row: 1, col: 2, animalId: 'a8' },  // Coco
  { id: 'c11', rackId: 'r2', row: 2, col: 1, animalId: 'a9' },  // Hera
  { id: 'c12', rackId: 'r2', row: 2, col: 2, animalId: undefined },
  { id: 'c13', rackId: 'r2', row: 3, col: 1, animalId: undefined },
  { id: 'c14', rackId: 'r2', row: 3, col: 2, animalId: undefined },
  // 렉사3 (4x3)
  { id: 'c15', rackId: 'r3', row: 1, col: 1, animalId: 'a3' },  // Thor (수컷)
  { id: 'c16', rackId: 'r3', row: 1, col: 2, animalId: 'a10' }, // Ares (수컷)
  { id: 'c17', rackId: 'r3', row: 1, col: 3, animalId: undefined },
  { id: 'c18', rackId: 'r3', row: 2, col: 1, animalId: undefined },
  { id: 'c19', rackId: 'r3', row: 2, col: 2, animalId: undefined },
  { id: 'c20', rackId: 'r3', row: 2, col: 3, animalId: undefined },
  { id: 'c21', rackId: 'r3', row: 3, col: 1, animalId: undefined },
  { id: 'c22', rackId: 'r3', row: 3, col: 2, animalId: undefined },
  { id: 'c23', rackId: 'r3', row: 3, col: 3, animalId: undefined },
  { id: 'c24', rackId: 'r3', row: 4, col: 1, animalId: undefined },
  { id: 'c25', rackId: 'r3', row: 4, col: 2, animalId: undefined },
  { id: 'c26', rackId: 'r3', row: 4, col: 3, animalId: undefined },
]

export const mockPairings: Pairing[] = [
  { id: 'p1', maleIds: ['a1'], femaleId: 'a4', date: '2026-02-15', status: 'LAID', memo: '첫 시즌 페어링' },
  { id: 'p2', maleIds: ['a1', 'a2'], femaleId: 'a5', date: '2026-02-20', status: 'MATING', memo: '교차 페어링' },
  { id: 'p3', maleIds: ['a2'], femaleId: 'a6', date: '2026-03-01', status: 'LAYING_SOON', memo: '' },
  { id: 'p4', maleIds: ['a1'], femaleId: 'a7', date: '2026-03-05', status: 'MATING', memo: '' },
  { id: 'p5', maleIds: ['a3'], femaleId: 'a8', date: '2026-01-10', status: 'LAID', memo: '쿨링 후 페어링' },
  { id: 'p6', maleIds: ['a10'], femaleId: 'a9', date: '2025-12-01', status: 'COOLING', memo: '시즌 종료 후 쿨링' },
]

export const mockEggs: Egg[] = [
  // p1 Luna - 1클러치 알 2개
  {
    id: 'e1', pairingId: 'p1', femaleId: 'a4',
    layDate: '2026-02-28',
    checked: true, fertile: true,
    temperatureLogs: [{ temp: 24, startDate: '2026-02-28' }],
    humidity: 80, substrate: 'Hatch-rite',
    status: 'INCUBATING', memo: '상태 양호',
  },
  {
    id: 'e1b', pairingId: 'p1', femaleId: 'a4',
    layDate: '2026-02-28',
    checked: true, fertile: true,
    temperatureLogs: [{ temp: 24, startDate: '2026-02-28' }],
    humidity: 80, substrate: 'Hatch-rite',
    status: 'INCUBATING', memo: '',
  },
  // p5 Coco - 1클러치 알 2개
  {
    id: 'e2', pairingId: 'p5', femaleId: 'a8',
    layDate: '2026-02-01',
    checked: false, fertile: null,
    temperatureLogs: [
      { temp: 22, startDate: '2026-02-01' },
      { temp: 24, startDate: '2026-03-01' },
    ],
    humidity: 75, substrate: 'Vermiculite',
    status: 'INCUBATING', memo: '3월부터 온도 올림',
  },
  {
    id: 'e2b', pairingId: 'p5', femaleId: 'a8',
    layDate: '2026-02-01',
    checked: false, fertile: null,
    temperatureLogs: [
      { temp: 22, startDate: '2026-02-01' },
      { temp: 24, startDate: '2026-03-01' },
    ],
    humidity: 75, substrate: 'Vermiculite',
    status: 'INCUBATING', memo: '',
  },
  // p5 Coco - 부화 완료 알 2개
  {
    id: 'e3', pairingId: 'p5', femaleId: 'a8',
    layDate: '2026-01-15',
    checked: true, fertile: true,
    temperatureLogs: [{ temp: 22, startDate: '2026-01-15' }],
    humidity: 80,
    status: 'HATCHED', hatchDate: '2026-03-25',
    memo: '부화 성공',
  },
  {
    id: 'e3b', pairingId: 'p5', femaleId: 'a8',
    layDate: '2026-01-15',
    checked: true, fertile: true,
    temperatureLogs: [{ temp: 22, startDate: '2026-01-15' }],
    humidity: 80,
    status: 'HATCHED', hatchDate: '2026-03-25',
    memo: '부화 성공',
  },
  // p1 Luna - 2클러치 알 1개
  {
    id: 'e4', pairingId: 'p1', femaleId: 'a4',
    layDate: '2026-03-15',
    checked: false, fertile: null,
    temperatureLogs: [{ temp: 26, startDate: '2026-03-15' }],
    humidity: 78,
    status: 'INCUBATING', memo: '2클러치',
  },
  // p5 Coco - 무정란 2개
  {
    id: 'e5', pairingId: 'p5', femaleId: 'a8',
    layDate: '2026-01-20',
    checked: true, fertile: false,
    temperatureLogs: [{ temp: 24, startDate: '2026-01-20' }],
    status: 'FAILED', memo: '무정란',
  },
  {
    id: 'e5b', pairingId: 'p5', femaleId: 'a8',
    layDate: '2026-01-20',
    checked: true, fertile: false,
    temperatureLogs: [{ temp: 24, startDate: '2026-01-20' }],
    status: 'FAILED', memo: '무정란',
  },
]

// ============ 헬퍼 함수 ============

export function getAnimal(id: string): BreedingAnimal | undefined {
  return mockAnimals.find(a => a.id === id)
}

export function getPairingStatus(animalId: string, pairings: Pairing[]): PairingStatus | null {
  const pairing = pairings.find(
    p => p.femaleId === animalId && p.status !== 'DONE'
  )
  return pairing?.status ?? null
}

export type CellStatus = 'empty' | 'male' | 'female' | 'waiting' | 'mating' | 'laying_soon' | 'cooling'

export function getCellStatus(
  cell: RackCell,
  animals: BreedingAnimal[],
  pairings: Pairing[],
): CellStatus {
  if (!cell.animalId) return 'empty'
  const animal = animals.find(a => a.id === cell.animalId)
  if (!animal) return 'empty'
  if (animal.gender === 'MALE') return 'male'
  const status = getPairingStatus(animal.id, pairings)
  if (status === 'COOLING') return 'cooling'
  if (status === 'LAYING_SOON') return 'laying_soon'
  if (status === 'MATING' || status === 'LAID') return 'mating'
  if (status === 'WAITING') return 'waiting'
  return 'female'
}

export const CELL_STATUS_CONFIG = {
  empty: { stripe: 'bg-transparent', label: '빈 칸', dot: 'bg-neutral-300', text: 'text-neutral-400' },
  male: { stripe: 'bg-blue-400', label: '수컷', dot: 'bg-blue-400', text: 'text-blue-600' },
  female: { stripe: 'bg-pink-200', label: '암컷', dot: 'bg-pink-300', text: 'text-pink-400' },
  waiting: { stripe: 'bg-orange-400', label: '메이팅 대기', dot: 'bg-orange-400', text: 'text-orange-600' },
  mating: { stripe: 'bg-violet-400', label: '산란 중', dot: 'bg-violet-400', text: 'text-violet-600' },
  laying_soon: { stripe: 'bg-red-500', label: '산란 임박', dot: 'bg-red-500', text: 'text-red-600' },
  cooling: { stripe: 'bg-sky-400', label: '쿨링', dot: 'bg-sky-400', text: 'text-sky-600' },
} as const
