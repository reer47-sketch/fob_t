import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware
 * Edge Runtime에서 실행되므로 최소한의 인증 체크만 수행
 * 상세한 권한/상태 체크는 각 Layout에서 처리
 */
export async function middleware(request: NextRequest) {
  // Supabase session 업데이트
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // 디바이스 감지 - 쿠키 우선 사용 (해상도 기반)
  // 클라이언트에서 DeviceDetector가 화면 크기로 판단하여 쿠키 설정
  const deviceCookie = request.cookies.get('device')?.value
  const isMobileOrTablet = deviceCookie === 'mobile'
  // Public routes (인증 불필요)
  const publicRoutes = ['/login', '/signup', '/pending', '/rejected', '/social-onboarding']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Public route는 인증된 사용자 체크
  if (isPublicRoute && user) {
    // /pending, /rejected, /social-onboarding은 상태와 관계없이 접근 가능
    if (pathname.startsWith('/pending') || pathname.startsWith('/rejected') || pathname.startsWith('/social-onboarding')) {
      return supabaseResponse
    }

    // /login, /signup 페이지는 무한 리다이렉트 방지를 위해 페이지 내부에서 처리하도록 허용
    if (pathname === '/login' || pathname === '/signup') {
      return supabaseResponse
    }

    // 이미 로그인된 사용자는 디바이스에 따라 분기
    const redirectUrl = isMobileOrTablet ? '/mobile' : '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Protected routes (인증 필요)
  const protectedRoutes = ['/admin', '/dashboard', '/mobile']
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // 인증되지 않은 사용자는 로그인 페이지로
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 디바이스와 경로 불일치 시 redirect
    // 모바일/태블릿 사용자가 데스크톱 경로 접근
    if (isMobileOrTablet && !pathname.startsWith('/mobile') && !pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/mobile', request.url))
    }
    // 데스크톱 사용자가 모바일 경로 접근
    if (!isMobileOrTablet && pathname.startsWith('/mobile')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 상세한 역할/상태 체크는 각 Layout에서 수행
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
