'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export interface SheetRoute<T extends Record<string, string>> {
  /** URL에 primary key가 있으면 true */
  isOpen: boolean
  /** URL에서 파싱한 현재 시트 상태 (닫혀있으면 null) */
  state: T | null
  /** 시트 열기 — router.push로 히스토리 엔트리 추가 (브라우저 뒤로가기로 자연 종료) */
  open: (state: T) => void
  /** 모드/하위 상태 전환 — router.replace로 현재 엔트리 덮어쓰기 */
  update: (patch: Partial<T>) => void
  /** 시트 닫기 — router.replace로 파라미터 제거 (back 레이스 방지) */
  close: () => void
}

/**
 * 시트/드로어 상태를 URL 쿼리 파라미터에 저장한다.
 *
 * keys의 첫 번째(primary) 파라미터가 URL에 존재하면 시트가 열린 것으로 판정한다.
 * 브라우저 뒤로가기/안드로이드 제스처는 히스토리를 되돌리는 것만으로 시트를
 * 자연스럽게 닫는다 — 우리가 popstate에 개입하지 않아 Next 라우터와 충돌하지 않는다.
 *
 * close()는 router.back 대신 router.replace를 사용한다. router.back은 비동기라
 * 사용자가 프로그램적 닫힘 직후 다른 링크를 클릭하면 큐잉된 back이 그 이동을
 * 되돌려버리는 레이스가 있기 때문. 트레이드오프: 프로그램적 close 후 뒤로가기
 * 한 번이 같은 URL로 남은 히스토리 엔트리에 닿아 "아무 변화 없음"으로 소모될 수
 * 있다 (팬텀 뒤로가기).
 */
export function useSheetRoute<T extends Record<string, string>>(
  keys: readonly string[],
): SheetRoute<T> {
  if (keys.length === 0) {
    throw new Error('useSheetRoute: keys 배열에 최소 한 개의 파라미터 이름이 필요합니다')
  }
  const primaryKey = keys[0]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state = useMemo<T | null>(() => {
    const primaryValue = searchParams.get(primaryKey)
    if (!primaryValue) return null
    const obj: Record<string, string> = {}
    for (const k of keys) {
      const v = searchParams.get(k)
      if (v != null) obj[k] = v
    }
    return obj as T
  }, [searchParams, keys, primaryKey])

  const buildUrl = useCallback(
    (next: T | null): string => {
      const params = new URLSearchParams(searchParams.toString())
      for (const k of keys) params.delete(k)
      if (next) {
        for (const k of keys) {
          const v = next[k as keyof T]
          if (typeof v === 'string' && v) params.set(k, v)
        }
      }
      const query = params.toString()
      return query ? `${pathname}?${query}` : pathname
    },
    [searchParams, pathname, keys],
  )

  const open = useCallback(
    (next: T) => {
      router.push(buildUrl(next), { scroll: false })
    },
    [router, buildUrl],
  )

  const update = useCallback(
    (patch: Partial<T>) => {
      if (!state) return
      const merged = { ...state, ...patch } as T
      router.replace(buildUrl(merged), { scroll: false })
    },
    [router, buildUrl, state],
  )

  const close = useCallback(() => {
    // 이미 닫힌 상태에서 중복 replace 방지 (라이브 URL 기준)
    if (typeof window !== 'undefined') {
      const live = new URLSearchParams(window.location.search)
      if (!live.get(primaryKey)) return
    }
    router.replace(buildUrl(null), { scroll: false })
  }, [router, buildUrl, primaryKey])

  return { isOpen: state !== null, state, open, update, close }
}
