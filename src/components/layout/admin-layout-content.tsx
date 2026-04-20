'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { getAdminPageTitle } from '@/lib/navigation'

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = getAdminPageTitle(pathname)

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 py-4 px-4 pt-0 overflow-x-hidden w-full max-w-[100vw]">
        {children}
      </div>
    </>
  )
}
