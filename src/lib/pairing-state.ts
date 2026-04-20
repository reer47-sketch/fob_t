/**
 * 페어링 상태 계산 — 서버/클라이언트 공용 순수 모듈.
 *
 * 스펙: docs/pairing-state-flow.md
 *
 * 표시 상태 4종: WAITING(메이팅 대기/배란기) / MATING(산란 중) / LAYING_SOON(산란 임박) / COOLING(쿨링)
 * DB 저장 상태: 'MATING' | 'DONE' 뿐. 나머지는 모두 런타임 파생.
 */

export const PAIRING_STATE = {
  OVULATION_REST_DAYS: 5,
  LAYING_SOON_DAYS: 25,
  COOLING_DAYS: 90,
  END_SCHEDULE_DAYS_AFTER_COOLING_INFERTILE: 5,
} as const

export type DerivedPairingStatus = 'WAITING' | 'MATING' | 'LAYING_SOON' | 'COOLING'

export const DERIVED_STATUS_LABEL: Record<DerivedPairingStatus, string> = {
  WAITING: '메이팅 대기',
  MATING: '산란 중',
  LAYING_SOON: '산란 임박',
  COOLING: '쿨링',
}

// ============ 날짜 유틸 ============

/** 캘린더 일(day) 단위 차이. lay_date는 UTC 자정으로 저장되므로 UTC 성분으로 정규화 */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  return Math.floor((b - a) / (1000 * 60 * 60 * 24))
}

/**
 * 주어진 산란일 후보들 중 페어 생성일보다 '나중'인 것만 필터해 최신 날짜를 반환.
 * 새 페어 등록을 메이팅 이벤트로 보고 배란기를 리셋하기 위해 페어 생성일 이전/당일 산란은 제외.
 */
export function resolveEffectiveLastLayDate(
  pairingDate: Date,
  candidateLayDates: ReadonlyArray<Date | string | null | undefined>,
): Date | null {
  const pdMs = pairingDate.getTime()
  let maxMs: number | null = null
  for (const d of candidateLayDates) {
    if (!d) continue
    const t = (typeof d === 'string' ? new Date(d) : d).getTime()
    if (t > pdMs && (maxMs === null || t > maxMs)) maxMs = t
  }
  return maxMs === null ? null : new Date(maxMs)
}

// ============ 파생 상태 계산 ============

/**
 * 활성 페어링(DONE 제외)의 표시 상태 계산.
 * 우선순위: 수동 쿨링 → 종료 예약 → 5일 배란기 → 25/90일 판정.
 *
 * `lastLayDate`는 호출자가 `resolveEffectiveLastLayDate`로 미리 필터링한 값.
 */
export function derivePairingStatus(input: {
  lastLayDate: Date | null
  manuallyCoolingAt: Date | null
  endScheduledAt: Date | null
  now: Date
}): DerivedPairingStatus {
  const { lastLayDate, manuallyCoolingAt, endScheduledAt, now } = input

  if (manuallyCoolingAt) return 'COOLING'
  if (endScheduledAt && endScheduledAt.getTime() > now.getTime()) return 'WAITING'
  if (lastLayDate === null) return 'MATING'

  const days = daysBetween(lastLayDate, now)
  if (days < PAIRING_STATE.OVULATION_REST_DAYS) return 'WAITING'
  if (days >= PAIRING_STATE.COOLING_DAYS) return 'COOLING'
  if (days >= PAIRING_STATE.LAYING_SOON_DAYS) return 'LAYING_SOON'
  return 'MATING'
}

// ============ DB 상태 전이 ============

/** 페어링 DB 필드 부분 패치 */
export type PairingCanonicalPatch = {
  status?: 'MATING' | 'DONE'
  endScheduledAt?: Date | null
  manuallyCoolingAt?: Date | null
  doneAt?: Date | null
}

/**
 * 산란 이벤트 후 페어링 DB 패치 계산.
 *
 * 규칙 (spec §5):
 * - 이미 DONE(시즌 종료) 페어 → 건드리지 않음. 산란 기록은 과거 백필 용도로 허용하되 상태는 부활시키지 않는다.
 * - 쿨링(자연 ≥90일 OR 수동) + 무정란만 있는 경우 → endScheduledAt = layDate+5, manuallyCoolingAt 해제
 * - 유정란이 하나라도 있으면 → 정상 산란 흐름(MATING, 예약/수동쿨링 모두 해제)
 * - 그 외 → status=MATING, endScheduledAt 해제 (수동쿨링은 유지)
 */
export function resolvePairingAfterEggLay(input: {
  currentStatus: string
  manuallyCoolingAt: Date | null
  /** 이번 클러치 '이전'의 마지막 산란일. 없으면 null */
  lastEggDateBeforeThisLay: Date | null
  layDate: Date
  hasFertile: boolean
  hasInfertile: boolean
  now: Date
}): PairingCanonicalPatch {
  const { currentStatus, manuallyCoolingAt, lastEggDateBeforeThisLay, layDate, hasFertile, hasInfertile, now } = input

  // DONE 페어는 산란 이벤트로 되살리지 않는다 (부활 금지)
  if (currentStatus === 'DONE') return {}

  const wasNaturalCooling =
    lastEggDateBeforeThisLay !== null &&
    daysBetween(lastEggDateBeforeThisLay, now) >= PAIRING_STATE.COOLING_DAYS
  const wasCooling = wasNaturalCooling || manuallyCoolingAt !== null

  // 쿨링 + 무정란만(유정란 없음) → 시즌 종료 예약
  if (wasCooling && hasInfertile && !hasFertile) {
    const endAt = new Date(layDate)
    endAt.setUTCDate(endAt.getUTCDate() + PAIRING_STATE.END_SCHEDULE_DAYS_AFTER_COOLING_INFERTILE)
    return {
      status: 'MATING',
      endScheduledAt: endAt,
      manuallyCoolingAt: null,
    }
  }

  // 유정란 포함 → 정상 흐름 복귀 (수동/자동 쿨링 예약 모두 해제)
  if (hasFertile) {
    return {
      status: 'MATING',
      endScheduledAt: null,
      manuallyCoolingAt: null,
    }
  }

  // 무정란만 있고 쿨링 아니었음 → 예약만 해제, 수동쿨링은 건드리지 않음
  return {
    status: 'MATING',
    endScheduledAt: null,
  }
}

/**
 * 산란(클러치) 삭제 후 페어링 DB 패치 계산.
 *
 * 핵심 버그 수정: 삭제된 클러치가 endScheduledAt을 유발한 무정란 클러치였을 수 있으므로 예약을 해제.
 * 이미 DONE으로 마감된 페어는 되살리지 않는다.
 */
export function resolvePairingAfterClutchDelete(input: {
  currentStatus: string
  endScheduledAt: Date | null
}): PairingCanonicalPatch {
  const { currentStatus, endScheduledAt } = input
  if (currentStatus === 'DONE') return {}
  if (endScheduledAt === null) return {}
  return { endScheduledAt: null }
}

/**
 * 관리자 시즌 종료(수동 쿨링) 액션의 패치.
 */
export function resolvePairingEnterManualCooling(now: Date): PairingCanonicalPatch {
  return {
    status: 'MATING',
    manuallyCoolingAt: now,
    endScheduledAt: null,
  }
}
