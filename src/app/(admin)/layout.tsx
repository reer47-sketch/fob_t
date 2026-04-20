import { getCurrentUser } from '@/actions/auth/get-current-user'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { redirect } from 'next/navigation'
import { AdminLayoutContent } from '@/components/layout/admin-layout-content'
import { Toaster } from '@/components/ui/sonner'

/**
 * 관리자 레이아웃
 * ADMIN 역할 전용
 */
export default async function AdminLayout({
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

  // 역할 체크 - ADMIN만 허용
  if (user.role !== 'ADMIN') {
    // BREEDER가 /admin으로 접근하면 dashboard로
    // 개발 테스트를 위해 잠시 주석 처리
    if (user.role === 'BREEDER') {
      redirect('/dashboard')
    }
    redirect('/login')
  }

  return(
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </SidebarInset>
    </SidebarProvider>
  )
}
