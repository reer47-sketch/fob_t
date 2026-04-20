"use client"

import * as React from "react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"
import { AdminNavMain } from "./admin-nav-main"

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string
    email: string
    name: string | null
    tenant: {
      id: string
      name: string
    } | null
  }
}

const AdminSidebarComponent = ({ user, ...props }: AdminSidebarProps) => {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/top-logo.png" alt="FOB" width={64} height={64} />
          <span className="font-semibold text-lg text-[#58BA2E] group-data-[collapsible=icon]:hidden">Fobreeders Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="hidden md:block">
        <AdminNavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export const AdminSidebar = React.memo(AdminSidebarComponent)
