'use client'

import { useEffect } from 'react'

const MOBILE_BREAKPOINT = 1200 // 태블릿까지 모바일로 처리

/**
 * 클라이언트에서 디바이스를 해상도 기반으로 감지하고 쿠키에 저장
 * 미들웨어가 이 쿠키를 읽어서 디바이스 타입을 판단
 */
export function DeviceDetector() {
  useEffect(() => {
    const updateDeviceCookie = () => {
      const isMobileOrTablet = window.innerWidth < MOBILE_BREAKPOINT
      document.cookie = `device=${isMobileOrTablet ? 'mobile' : 'desktop'}; path=/; max-age=31536000; SameSite=Lax`
    }

    // 초기 설정
    updateDeviceCookie()

    // 화면 크기 변경 감지
    window.addEventListener('resize', updateDeviceCookie)
    return () => window.removeEventListener('resize', updateDeviceCookie)
  }, [])

  return null
}
