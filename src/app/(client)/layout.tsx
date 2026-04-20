
import { getCurrentUser } from '@/actions/auth/get-current-user'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SpeciesOnboardingGuard } from '@/components/species-onboarding-guard'
import { SidebarProvider } from '@/components/ui/sidebar'
import { redirect } from 'next/navigation'

/**
 * 브리더 레이아웃
 * BREEDER 역할 전용
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  // 인증 체크
  if (!currentUser.success || !currentUser.data) {
    redirect('/login')
  }

  const user = currentUser.data

  // 상태 체크
  if (user.status === 'PENDING') {
    redirect('/pending')
  }

  if (user.status === 'REJECTED') {
    redirect('/rejected')
  }

  if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
    redirect('/login')
  }

  // 역할 체크 - BREEDER만 허용
  if (user.role !== 'BREEDER') {
    // ADMIN이 /dashboard로 접근하면 admin 페이지로
    if (user.role === 'ADMIN') {
      redirect('/admin')
    }
    redirect('/login')
  }

  const hasSpecies = (user.tenant?._count?.tenantCodes ?? 0) > 0

  return (
    <div className="flex h-dvh overflow-hidden">
      <SidebarProvider>
        <AppSidebar user={user} />
            {children}
        <SpeciesOnboardingGuard hasSpecies={hasSpecies} />
      </SidebarProvider>
    </div>
  )
}
