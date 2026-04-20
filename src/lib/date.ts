import { format as dateFnsFormat } from 'date-fns'
import { ko } from 'date-fns/locale'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

/**
 * 한국 시간대 유틸리티
 * - DB는 UTC(ISO)로 저장
 * - 화면 표시 및 사용자 입력은 KST 기준
 */

export const TIMEZONE = 'Asia/Seoul'

// ============================================
// 타임존 변환
// ============================================

/**
 * KST 날짜 → UTC (DB 저장용)
 * @example toUTC(new Date(2024, 1, 1)) // KST 2월 1일 → UTC 1월 31일 15:00
 */
export const toUTC = (date: Date): Date => fromZonedTime(date, TIMEZONE)

/**
 * UTC → KST (화면 표시용)
 * @example toKST(dbDate) // UTC 시간을 KST로 변환
 */
export const toKST = (date: Date): Date => toZonedTime(date, TIMEZONE)

// ============================================
// 날짜/시간 추출
// ============================================

/**
 * KST 기준 일자 추출 (1~31)
 */
export const getKSTDay = (date: Date): number => toKST(date).getDate()

/**
 * KST 기준 월 추출 (1~12)
 */
export const getKSTMonth = (date: Date): number => toKST(date).getMonth() + 1

/**
 * KST 기준 연도 추출
 */
export const getKSTYear = (date: Date): number => toKST(date).getFullYear()

/**
 * KST 기준 현재 년/월
 */
export const getCurrentYearMonth = (): { year: number; month: number } => {
  const now = toKST(new Date())
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

/**
 * KST 기준 현재 날짜 (시분초 제외)
 */
export const getToday = (): Date => {
  const now = toKST(new Date())
  now.setHours(0, 0, 0, 0)
  return now
}

// ============================================
// 월/일 범위 계산
// ============================================

/**
 * 해당 월의 일수
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate()
}

/**
 * KST 기준 월 범위 → UTC (DB 쿼리용)
 * @example getMonthRange(2024, 2) // 2월 전체 범위를 UTC로 반환
 */
export const getMonthRange = (
  year: number,
  month: number
): { start: Date; end: Date } => {
  const kstStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const kstEnd = new Date(year, month, 0, 23, 59, 59, 999)
  return {
    start: toUTC(kstStart),
    end: toUTC(kstEnd),
  }
}

/**
 * KST 기준 일 범위 → UTC (DB 쿼리용)
 * @example getDayRange(2024, 2, 15) // 2월 15일 하루 범위
 */
export const getDayRange = (
  year: number,
  month: number,
  day: number
): { start: Date; end: Date } => {
  const kstStart = new Date(year, month - 1, day, 0, 0, 0, 0)
  const kstEnd = new Date(year, month - 1, day, 23, 59, 59, 999)
  return {
    start: toUTC(kstStart),
    end: toUTC(kstEnd),
  }
}

/**
 * 문자열 날짜 범위 → UTC (DB 쿼리용)
 * @example getDateStringRange('2024-02-01', '2024-02-28')
 */
export const getDateStringRange = (
  from?: string,
  to?: string
): { start?: Date; end?: Date } => {
  const result: { start?: Date; end?: Date } = {}

  if (from) {
    const [year, month, day] = from.split('-').map(Number)
    const kstStart = new Date(year, month - 1, day, 0, 0, 0, 0)
    result.start = toUTC(kstStart)
  }

  if (to) {
    const [year, month, day] = to.split('-').map(Number)
    const kstEnd = new Date(year, month - 1, day, 23, 59, 59, 999)
    result.end = toUTC(kstEnd)
  }

  return result
}

// ============================================
// 날짜 계산
// ============================================

/**
 * 일수 더하기
 * @example addDays(date, 90) // +90일
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * 일수 빼기
 * @example subDays(date, 30) // -30일
 */
export const subDays = (date: Date, days: number): Date => {
  return addDays(date, -days)
}

/**
 * 월수 더하기
 * @example addMonths(date, 3) // +3개월
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * 월수 빼기
 */
export const subMonths = (date: Date, months: number): Date => {
  return addMonths(date, -months)
}

/**
 * 년수 더하기
 */
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

/**
 * 년수 빼기
 */
export const subYears = (date: Date, years: number): Date => {
  return addYears(date, -years)
}

// ============================================
// 포맷팅
// ============================================

/**
 * 한국어 날짜 포맷팅 (UTC → KST 변환 후 포맷)
 * @example formatKST(dbDate, 'yyyy-MM-dd') // "2024-02-01"
 * @example formatKST(dbDate, 'yyyy.MM.dd (E)') // "2024.02.01 (목)"
 */
export const formatKST = (
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const kstDate = toKST(d)
  return dateFnsFormat(kstDate, formatStr, { locale: ko })
}

/**
 * 날짜만 포맷 (yyyy-MM-dd)
 */
export const formatDate = (date: Date | string): string => {
  return formatKST(date, 'yyyy-MM-dd')
}

/**
 * 날짜+시간 포맷 (yyyy-MM-dd HH:mm)
 */
export const formatDateTime = (date: Date | string): string => {
  return formatKST(date, 'yyyy-MM-dd HH:mm')
}

/**
 * 한국식 날짜 (yyyy.MM.dd)
 */
export const formatKoreanDate = (date: Date | string): string => {
  return formatKST(date, 'yyyy.MM.dd')
}

/**
 * 한국식 날짜+요일 (yyyy.MM.dd (E))
 */
export const formatKoreanDateWithDay = (date: Date | string): string => {
  return formatKST(date, 'yyyy.MM.dd (E)')
}

// ============================================
// 파싱
// ============================================

/**
 * yyyy-MM-dd 문자열 → Date (KST 기준 00:00:00)
 */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * yyyy-MM-dd 문자열 → UTC Date (DB 저장용)
 */
export const parseDateToUTC = (dateStr: string): Date => {
  return toUTC(parseDate(dateStr))
}

// ============================================
// 비교
// ============================================

/**
 * 같은 날인지 비교 (KST 기준)
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  const kst1 = toKST(date1)
  const kst2 = toKST(date2)
  return (
    kst1.getFullYear() === kst2.getFullYear() &&
    kst1.getMonth() === kst2.getMonth() &&
    kst1.getDate() === kst2.getDate()
  )
}

/**
 * date1이 date2보다 이전인지
 */
export const isBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime()
}

/**
 * date1이 date2보다 이후인지
 */
export const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime()
}

/**
 * 오늘인지 (KST 기준)
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date())
}

// ============================================
// 두 날짜 사이 계산
// ============================================

/**
 * 두 날짜 사이의 일수
 */
export const diffInDays = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 두 날짜 사이의 월수 (대략적)
 */
export const diffInMonths = (date1: Date, date2: Date): number => {
  const months =
    (date2.getFullYear() - date1.getFullYear()) * 12 +
    (date2.getMonth() - date1.getMonth())
  return Math.abs(months)
}
