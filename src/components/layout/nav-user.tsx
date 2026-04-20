"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import {
  ChevronsUpDown,
  LogOut,
  UserCog,
  KeyRound,
  PawPrint,
  CreditCard,
  Palette,
} from "lucide-react"

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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { signOut } from "@/actions/auth/sign-out"
import { EditProfileDialog } from "@/components/dialogs/edit-profile-dialog"
import { ChangePasswordDialog } from "@/components/dialogs/change-password-dialog"
import { SpeciesSettingsDialog } from "@/components/dialogs/species-settings-dialog"

const THEMES = [
  { value: 'green',  label: '그린',   color: '#58BA2E' },
  { value: 'black',  label: '블랙',   color: '#111111' },
  { value: 'pink',   label: '핑크',   color: '#EC4899' },
  { value: 'orange', label: '오렌지', color: '#F97316' },
  { value: 'violet', label: '바이올렛', color: '#7C3AED' },
  { value: 'blue',   label: '블루',   color: '#3B82F6' },
]

interface NavUserProps {
  user: {
    id: string
    email: string
    name: string | null
    phone?: string | null
    profileImage?: string | null
    marketingAgreed?: boolean | null
    tenant: {
      id: string
      name: string
      address?: string | null
    } | null
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  // tenantName(userName) 형식으로 표시
  const displayName = user.tenant?.name && user.name
    ? `${user.tenant.name}(${user.name})`
    : user.tenant?.name || user.name || user.email
  const fallback = displayName.substring(0, 2).toUpperCase();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.profileImage || undefined} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
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
              <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                <UserCog />
                정보 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                <KeyRound />
                비밀번호 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                <PawPrint />
                관리 종 선택
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/account')}>
                <CreditCard />
                마이페이지
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                  <Palette className="size-3" />
                  테마
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {THEMES.map(t => (
                    <button
                      key={t.value}
                      title={t.label}
                      onClick={() => setTheme(t.value)}
                      className="w-6 h-6 rounded-full ring-offset-background transition-all hover:scale-110"
                      style={{
                        backgroundColor: t.color,
                        outline: theme === t.value ? `2px solid ${t.color}` : '2px solid transparent',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <EditProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        user={user}
      />

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />

      <SpeciesSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </>
  )
}
