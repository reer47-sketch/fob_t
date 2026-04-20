'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileDown, Loader2 } from 'lucide-react'
import type { SearchFilters } from './sales-search-filters'
import { getSalesForPdfAction } from '@/actions/sales/get-sales-for-pdf'
import { updateReportedStatusAction } from '@/actions/sales/update-reported-status'
import { generateYangsuYangdoPdf, downloadPdf } from '@/lib/pdf-generator'
import { toast } from 'sonner'

export type ReportType = 'yangsu' | 'yangdo'

interface PdfDownloadButtonProps {
  type: ReportType
  totalCount: number
  disabled: boolean
  filters: SearchFilters
  onRefresh?: () => void
}

const REPORT_LABELS: Record<ReportType, { button: string; title: string; filename: string }> = {
  yangsu: { button: '양수 신고서', title: '양수 신고서 다운로드', filename: '양수신고서' },
  yangdo: { button: '양도 신고서', title: '양도 신고서 다운로드', filename: '양도신고서' },
}

export function PdfDownloadButton({ type, totalCount, disabled, filters, onRefresh }: PdfDownloadButtonProps) {
  const label = REPORT_LABELS[type]
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleButtonClick = () => {
    setIsDialogOpen(true)
  }

  const handleConfirm = async () => {
    setIsGenerating(true)

    try {
      // 1. 전체 데이터 조회
      const result = await getSalesForPdfAction(filters)

      if (!result.success || !result.data) {
        throw new Error(result.error || '데이터 조회 실패')
      }

      // 2. PDF 생성
      const pdfBlob = await generateYangsuYangdoPdf(result.data, type)

      // 3. 파일명 생성
      const now = new Date()
      const filename = `${label.filename}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`

      // 4. 다운로드
      downloadPdf(pdfBlob, filename)

      // 5. 양도인 경우에만 신고 상태 업데이트
      if (type === 'yangdo') {
        const animalIds = result.data.map((animal) => animal.id)
        const updateResult = await updateReportedStatusAction(animalIds)

        setIsDialogOpen(false)
        onRefresh?.()

        if (updateResult.success && updateResult.data) {
          toast.success(`${result.data.length}건의 신고서가 다운로드되었습니다`, {
            description: `${updateResult.data.updatedCount}건의 개체가 신고완료로 표시되었습니다`,
            duration: 1000,
          })
        } else {
          toast.success(`${result.data.length}건의 신고서가 다운로드되었습니다`, {
            duration: 1000,
          })
        }
      } else {
        setIsDialogOpen(false)
        toast.success(`${result.data.length}건의 양수 신고서가 다운로드되었습니다`, {
          duration: 1000,
        })
      }
    } catch (error) {
      console.error('PDF 다운로드 실패:', error)
      toast.error(error instanceof Error ? error.message : 'PDF 생성 중 오류가 발생했습니다', {
        duration: 1000,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled}
        onClick={handleButtonClick}
      >
        <FileDown className="h-4 w-4" />
        {label.button} ({totalCount}건)
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{label.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  총 <span className="font-semibold text-foreground">{totalCount}건</span>의 신고서를 다운로드합니다
                </div>
                {type === 'yangdo' && (
                  <div className="pt-2 border-t">
                    신고서 다운로드 시 미신고 개체는 자동으로 <span className="font-semibold text-green-600 dark:text-green-400">&apos;신고완료&apos;</span>로 표시됩니다
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isGenerating}>
              취소
            </Button>
            <Button onClick={handleConfirm} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '다운로드'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
