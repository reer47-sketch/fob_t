'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

interface BulkFeatureGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkFeatureGateModal({ open, onOpenChange }: BulkFeatureGateModalProps) {
  const handleContact = () => {
    // TODO: 외부 문의 채널 확정 시 교체 (카카오톡/이메일/전화)
    toast.info('문의 채널 준비 중입니다.')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <DialogTitle className="text-lg">유료 고객 전용 기능입니다</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm leading-relaxed">
            일괄등록/편집 기능을 사용하면 한 번에 다수의 개체를 등록하거나
            주요 필드를 묶어 편집할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleContact} className="w-full">
            문의하기
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
