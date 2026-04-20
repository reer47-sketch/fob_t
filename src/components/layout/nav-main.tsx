"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { memo, useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { navItems } from "@/lib/navigation"
import { BulkFeatureGateModal } from "@/components/bulk-feature-gate-modal"

interface NavMainProps {
  userPlan: string
}

const NavMainComponent = ({ userPlan }: NavMainProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const [gateModalOpen, setGateModalOpen] = useState(false)

  const isFree = userPlan === 'FREE'

  const handleLinkClick = () => {
    setOpenMobile(false)
  }

  const handlePaidItemClick = (url: string) => {
    if (isFree) {
      setGateModalOpen(true)
    } else {
      setOpenMobile(false)
      router.push(url)
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>메뉴</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.paid && isFree ? (
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    onClick={() => handlePaidItemClick(item.url)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url} asChild>
                    <Link href={item.url} onClick={handleLinkClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <BulkFeatureGateModal open={gateModalOpen} onOpenChange={setGateModalOpen} />
    </>
  )
}

export const NavMain = memo(NavMainComponent)
