import { Heart, Egg, AlertCircle, Snowflake, Check } from 'lucide-react'
import {
  PAIRING_STATE,
  daysBetween,
  resolveEffectiveLastLayDate,
  derivePairingStatus as derivePairingStatusCore,
  type DerivedPairingStatus,
} from '@/lib/pairing-state'
import type {
  RackDataCell,
  RackDataPairing,
  RackDataAnimal,
} from '@/services/breeding-management-service'

// ============ 타입 ============

export type SheetMode =
  | 'detail'
  | 'pairing'
  | 'pairing-edit'
  | 'egg'
  | 'assign'
  | 'zone-create'
  | 'zone-edit'
  | 'rack-create'
  | 'rack-edit'
  | 'laying-history'
  | 'pairing-history'

export type CellStatus =
  | 'empty'
  | 'male'
  | 'female'
  | 'waiting'
  | 'mating'
  | 'laying_soon'
  | 'cooling'

// ============ 셀 스타일 ============

export const BENTO_STYLES = {
  empty: { bg: 'bg-neutral-50', border: 'border-neutral-100', icon: null },
  male: { bg: 'bg-white', border: 'border-neutral-200', icon: null },
  female: { bg: 'bg-white', border: 'border-pink-100', icon: null },
  waiting: { bg: 'bg-gradient-to-br from-orange-50 to-amber-50', border: 'border-orange-200', icon: Heart },
  mating: { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-200', icon: Egg },
  laying_soon: { bg: 'bg-gradient-to-br from-red-100 to-rose-100', border: 'border-red-300', icon: AlertCircle },
  cooling: { bg: 'bg-gradient-to-br from-sky-50 to-cyan-50', border: 'border-sky-200', icon: Snowflake },
} as const

// 사다리꼴 렉사 셀 — viewBox 100x75
export const TRAPEZOID_PATH =
  'M 6 2 L 94 2 Q 97 2 97 5 L 87 71 Q 87 73 84 73 L 16 73 Q 13 73 13 71 L 3 5 Q 3 2 6 2 Z'
export const TRAPEZOID_VENT_DOTS = [22, 36, 50, 64, 78]
export const TRAPEZOID_VENT_DOTS_COMPACT = [30, 50, 70]

export const CELL_SHAPE_COLORS: Record<CellStatus, { fill: string; stroke: string }> = {
  empty: { fill: '#fafafa', stroke: '#e5e5e5' },
  male: { fill: '#ffffff', stroke: '#e5e7eb' },
  female: { fill: '#ffffff', stroke: '#fbcfe8' },
  waiting: { fill: '#fff7ed', stroke: '#fed7aa' },
  mating: { fill: '#f5f3ff', stroke: '#ddd6fe' },
  laying_soon: { fill: '#fee2e2', stroke: '#fca5a5' },
  cooling: { fill: '#f0f9ff', stroke: '#bae6fd' },
}

// ============ 파생 상태 어댑터 ============

/**
 * RackDataPairing + femaleLatestEggLayDate → DerivedPairingStatus.
 * 페어 생성일 이후 산란 분만 반영해 과거 단독 산란이 새 페어 상태를 오염시키지 않도록 한다.
 */
export function derivePairingStatus(
  pairing: RackDataPairing,
  femaleLatestEggLayDate: string | null,
  now: Date = new Date(),
): DerivedPairingStatus {
  const pairingDate = new Date(pairing.date)
  const pairingEggLatest =
    pairing.eggs.length > 0
      ? pairing.eggs.reduce((max, e) => (e.layDate > max ? e.layDate : max), pairing.eggs[0].layDate)
      : null
  const lastLayDate = resolveEffectiveLastLayDate(pairingDate, [pairingEggLatest, femaleLatestEggLayDate])

  return derivePairingStatusCore({
    lastLayDate,
    manuallyCoolingAt: pairing.manuallyCoolingAt ? new Date(pairing.manuallyCoolingAt) : null,
    endScheduledAt: pairing.endScheduledAt ? new Date(pairing.endScheduledAt) : null,
    now,
  })
}

export function getCellStatusFromData(
  cell: RackDataCell,
  pairings: RackDataPairing[],
  latestEggLayDateByFemaleId: Record<string, string>,
  now: Date = new Date(),
): CellStatus {
  if (!cell.animal) return 'empty'
  if (cell.animal.gender === 'MALE') return 'male'

  const femaleId = cell.animal.id
  const femaleLatestEggDate = latestEggLayDateByFemaleId[femaleId] ?? null
  const pairing = pairings.find((p) => p.femaleId === femaleId && p.status !== 'DONE')

  if (pairing) {
    const derived = derivePairingStatus(pairing, femaleLatestEggDate, now)
    if (derived === 'WAITING') return 'waiting'
    if (derived === 'MATING') return 'mating'
    if (derived === 'LAYING_SOON') return 'laying_soon'
    return 'cooling'
  }

  if (femaleLatestEggDate !== null) {
    const daysSinceLastEgg = daysBetween(new Date(femaleLatestEggDate), now)
    if (daysSinceLastEgg < PAIRING_STATE.OVULATION_REST_DAYS) return 'waiting'
  }
  return 'female'
}

/**
 * 셀 경과일 라벨 (D+N).
 * - 활성 페어 + 산란 0건: 페어 시작일 기준
 * - 그 외: 최근 산란일 기준
 */
export function getCellDaysLabel(
  cell: RackDataCell,
  pairings: RackDataPairing[],
  latestEggLayDateByFemaleId: Record<string, string>,
  now: Date = new Date(),
): string | null {
  if (!cell.animal || cell.animal.gender !== 'FEMALE') return null
  const femaleId = cell.animal.id
  const femaleLatestEggDate = latestEggLayDateByFemaleId[femaleId] ?? null
  const pairing = pairings.find((p) => p.femaleId === femaleId && p.status !== 'DONE')

  if (pairing) {
    const pairingDate = new Date(pairing.date)
    const pairingEggLatest =
      pairing.eggs.length > 0
        ? pairing.eggs.reduce((max, e) => (e.layDate > max ? e.layDate : max), pairing.eggs[0].layDate)
        : null
    const anchor = resolveEffectiveLastLayDate(pairingDate, [pairingEggLatest, femaleLatestEggDate])
    if (!anchor) return `D+${daysBetween(pairingDate, now)}`
    return `D+${daysBetween(anchor, now)}`
  }

  if (femaleLatestEggDate !== null) {
    return `D+${daysBetween(new Date(femaleLatestEggDate), now)}`
  }
  return null
}

// ============ 공용 컴포넌트 ============

export function AnimalSelectCard({
  animal,
  selected,
  onToggle,
}: {
  animal: RackDataAnimal
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={`flex items-center gap-3 w-full rounded-2xl border-2 p-3 text-left transition-[border-color,background-color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${selected
        ? 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-300'
        : 'bg-white border-neutral-200 hover:border-neutral-300'
        }`}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center shrink-0 overflow-hidden">
        {animal.imageUrl ? (
          <img
            src={animal.imageUrl}
            alt={animal.name ?? '수컷 개체 사진'}
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-blue-400 text-lg">♂</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold truncate">{animal.name ?? animal.uniqueId}</div>
        <div className="text-xs text-muted-foreground truncate">{animal.morph}</div>
      </div>
      {selected ? (
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 shrink-0">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-neutral-200 shrink-0" />
      )}
    </button>
  )
}
