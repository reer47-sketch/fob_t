'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Tag } from 'lucide-react'

export type ExportType = 'management' | 'label'

interface ExportExcelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectType: (type: ExportType) => void
}

export function ExportExcelModal({
  open,
  onOpenChange,
  onSelectType,
}: ExportExcelModalProps) {
  const handleSelect = (type: ExportType) => {
    onSelectType(type)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>엑셀 다운로드</DialogTitle>
          <DialogDescription>
            다운로드 형식을 선택해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={() => handleSelect('label')}
            className="h-auto flex flex-col items-start gap-2 p-4"
            variant="outline"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <span className="font-semibold">라벨지용</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              라벨 인쇄에 필요한 간소화된 정보만 포함
            </p>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
