'use client'

import { useState } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { getPageTitle } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { ScanLine } from 'lucide-react'
import { QrScannerSheet } from './qr-scanner-sheet'
import { AnimalDetailSheet } from '@/app/(client)/(desktop)/animals/_components/animal-detail-sheet'

interface ClientLayoutContentProps {
  children: React.ReactNode
  className?: string
}

export function ClientLayoutContent({ children, className }: ClientLayoutContentProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const [qrOpen, setQrOpen] = useState(false)
  const [scannedAnimalId, setScannedAnimalId] = useState<string | null>(null)
  const [animalDetailOpen, setAnimalDetailOpen] = useState(false)

  const handleScanned = (animalId: string) => {
    setScannedAnimalId(animalId)
    setAnimalDetailOpen(true)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex flex-1 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="ml-auto">
            <button
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center justify-center h-8 w-8"
            >
              <ScanLine className="size-5 text-black" />
            </button>
          </div>
        </div>
      </header>
      <div className={cn('flex flex-1 flex-col gap-4 pt-0 overflow-y-auto', className)}>
        {children}
      </div>
      <QrScannerSheet open={qrOpen} onOpenChange={setQrOpen} onScanned={handleScanned} />
      <AnimalDetailSheet
        animalId={scannedAnimalId}
        open={animalDetailOpen}
        onOpenChange={setAnimalDetailOpen}
      />
    </>
  )
}
