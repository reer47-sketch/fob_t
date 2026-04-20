'use client'

import { usePathname } from 'next/navigation'
import { getPageTitle } from '@/lib/navigation'
import { useEffect } from 'react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import { signOut } from "@/actions/auth/sign-out"

interface MobileLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    email: string
    name: string | null
    profileImage?: string | null
    tenant: {
      id: string
      name: string
    } | null
  }
}

export function MobileLayout({ children, user }: MobileLayoutProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  // tenantName(userName) 형식으로 표시
  const displayName = user.tenant?.name && user.name
    ? `${user.tenant.name}(${user.name})`
    : user.tenant?.name || user.name || user.email
  const fallback = displayName.substring(0, 2).toUpperCase()

  // 모바일 뷰포트 높이 설정
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)

    return () => window.removeEventListener('resize', setVH)
  }, [])

  return (
    <div className="flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* 모바일 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-2">
          <img src="/top-logo.png" alt="FOB" width={32} height={32} />
          <span className="font-semibold text-[#58BA2E]">Fobreeders</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.profileImage || undefined} alt={displayName} />
                <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.profileImage || undefined} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-4">
          {children}
        </div>
      </main>
    </div>
  )
}
