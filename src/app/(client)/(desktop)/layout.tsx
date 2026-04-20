import { SidebarInset } from '@/components/ui/sidebar'
import { ClientLayoutContent } from '@/components/layout/client-layout-content'

export default async function DesktopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarInset className="flex-1 min-w-0 overflow-hidden">
      <ClientLayoutContent className='px-4'>
        {children}
      </ClientLayoutContent>
    </SidebarInset>
  )
}
