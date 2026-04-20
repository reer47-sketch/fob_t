"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ScanLine, Bot, BookOpen } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"
import { NavMain } from "./nav-main"
import { NavQuickActions } from "./nav-quick-actions"
import { QrScannerSheet } from "./qr-scanner-sheet"
import { AnimalDetailSheet } from "@/app/(client)/(desktop)/animals/_components/animal-detail-sheet"
import { QuickReportModal } from "@/components/quick-report-modal"
import { AiAssistant } from "@/components/ai-assistant/ai-assistant"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string
    email: string
    name: string | null
    plan: string
    tenant: {
      id: string
      name: string
    } | null
  }
}

const AppSidebarComponent = ({ user, ...props }: AppSidebarProps) => {
  const pathname = usePathname()
  const isMobile = pathname?.startsWith('/mobile')
  const homeUrl = isMobile ? '/mobile' : '/dashboard'
  const [qrOpen, setQrOpen] = React.useState(false)
  const [scannedAnimalId, setScannedAnimalId] = React.useState<string | null>(null)
  const [animalDetailOpen, setAnimalDetailOpen] = React.useState(false)
  const [reportModalOpen, setReportModalOpen] = React.useState(false)
  const [aiAssistantOpen, setAiAssistantOpen] = React.useState(false)
  const { state } = useSidebar()

  const handleScanned = (animalId: string) => {
    setScannedAnimalId(animalId)
    setAnimalDetailOpen(true)
  }
  const isCollapsed = state === 'collapsed'

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <Link href={homeUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/top-logo.png" alt="FOB" width={64} height={64} />
            <span className="font-semibold text-lg text-[#58BA2E] group-data-[collapsible=icon]:hidden">Fobreeders</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <NavMain userPlan={user.plan} />
          <NavQuickActions onReportClick={() => setReportModalOpen(true)} />
        </SidebarContent>
        <SidebarGroup className="mt-auto pb-2 space-y-1">
          <SidebarGroupContent className="space-y-1">
            <button
              onClick={() => setAiAssistantOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2"
              title="AI 음성 도우미"
            >
              <Bot className="size-4 shrink-0" />
              {!isCollapsed && <span>AI 음성 도우미</span>}
            </button>
            <button
              onClick={() => setQrOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-muted-foreground text-sm font-medium hover:bg-muted hover:text-foreground transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2"
              title="QR 스캔"
            >
              <ScanLine className="size-4 shrink-0" />
              {!isCollapsed && <span>QR 스캔</span>}
            </button>
            <Link
              href="/help"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-muted-foreground text-sm font-medium hover:bg-muted hover:text-foreground transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2"
              title="사용자 매뉴얼"
            >
              <BookOpen className="size-4 shrink-0" />
              {!isCollapsed && <span>사용자 매뉴얼</span>}
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <QrScannerSheet open={qrOpen} onOpenChange={setQrOpen} onScanned={handleScanned} />
      <AnimalDetailSheet
        animalId={scannedAnimalId}
        open={animalDetailOpen}
        onOpenChange={setAnimalDetailOpen}
      />
      <QuickReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
      <AiAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} />
    </>
  )
}

export const AppSidebar = React.memo(AppSidebarComponent)
