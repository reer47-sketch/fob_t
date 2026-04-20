"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { memo, useEffect, useState } from "react"

interface NavQuickActionsProps {
  onReportClick?: () => void
}

const MOBILE_BREAKPOINT = 1200 // 태블릿까지 모바일로 처리

const NavQuickActionsComponent = ({ onReportClick }: NavQuickActionsProps) => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)
  const { setOpenMobile } = useSidebar()

  useEffect(() => {
    const checkDevice = () => {
      setIsMobileOrTablet(window.innerWidth < MOBILE_BREAKPOINT)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const handleLinkClick = () => {
    setOpenMobile(false)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>빠른 등록</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="개체 등록">
              <Link href="/animals/register" onClick={handleLinkClick}>
                <span>개체 등록</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="양수양도 신고서"
              onClick={() => {
                setOpenMobile(false)
                onReportClick?.()
              }}
            >
              <span>양수양도 신고서</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isMobileOrTablet && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="피딩">
                <Link href="/mobile/feeding" onClick={handleLinkClick}>
                  <span>피딩</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export const NavQuickActions = memo(NavQuickActionsComponent)
