"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ScanLine, Loader2, Copy, Check, ChevronRight, ExternalLink, CalendarDays, ShoppingCart } from 'lucide-react'
import { getAnimalDetail } from '@/actions/animals/get-animal-detail'
import type { AnimalDetailData } from '@/services/animal-service'
import { QrScanner } from './qr-scanner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type SheetView = 'scanning' | 'result'

interface QrScannerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanned?: (animalId: string) => void
  mode?: 'view' | 'select'
  onAnimalSelect?: (animal: { id: string; uniqueId: string; name: string | null; gender: string; acquisitionDate: Date }) => void
}

export function QrScannerSheet({ open, onOpenChange, onScanned, mode = 'view', onAnimalSelect }: QrScannerSheetProps) {
  const router = useRouter()
  const [view, setView] = useState<SheetView>('scanning')
  const [animal, setAnimal] = useState<AnimalDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyId = async () => {
    if (!animal?.uniqueId) return
    await navigator.clipboard.writeText(animal.uniqueId)
    setCopied(true)
    toast.success('개체 ID가 복사되었습니다')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleScanned = async (animalId: string) => {
    setIsLoading(true)
    try {
      const result = await getAnimalDetail(animalId)
      if (result.success && 'data' in result && result.data) {
        if (mode === 'select') {
          const a = result.data
          onAnimalSelect?.({ id: a.id, uniqueId: a.uniqueId, name: a.name, gender: a.gender, acquisitionDate: a.acquisitionDate })
          handleOpenChange(false)
        } else {
          setAnimal(result.data)
          setView('result')
        }
      } else {
        toast.error('개체 정보를 찾을 수 없습니다')
      }
    } catch {
      toast.error('개체 정보를 불러오는 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setView('scanning')
      setAnimal(null)
    }
    onOpenChange(open)
  }

  const handleRescan = () => {
    setView('scanning')
    setAnimal(null)
  }

  const handleViewDetail = () => {
    if (animal) {
      onScanned?.(animal.id)
    }
  }

  const speciesCode = animal?.codes?.find((c) => c.code.category === 'SPECIES') ?? null
  const morphCodes = animal?.codes?.filter((c) => c.code.category === 'MORPH') ?? []

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-xl p-0">
        <div className="flex flex-col h-full px-4 pb-4">

          {/* 헤더 */}
          <SheetHeader className="pb-3 flex-row items-center gap-2">
            {view === 'result' && (
              <button onClick={handleRescan} className="p-1 -ml-1 rounded-md hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <SheetTitle className="flex-1 text-left">
              {view === 'scanning' ? 'QR 스캔' : ''}
            </SheetTitle>
          </SheetHeader>

          {/* 스캔 뷰 */}
          {view === 'scanning' && (
            <div className="flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm">개체 정보를 불러오는 중...</p>
                </div>
              ) : (
                <QrScanner onScanned={handleScanned} />
              )}
            </div>
          )}

          {/* 결과 뷰 */}
          {view === 'result' && animal && (
            <div className="flex-1 flex flex-col min-h-0">

              {/* 프로필 섹션 */}
              <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 pb-4">
                {/* 프로필 이미지 - 둥근 네모 */}
                <div className="w-[180px] h-[180px] rounded-2xl overflow-hidden bg-gray-100 shadow-md shrink-0">
                  {animal.images?.[0]?.imageUrl ? (
                    <img
                      src={animal.images[0].imageUrl}
                      alt={animal.name || '개체 이미지'}
                      className="w-full h-full object-cover"
                      style={{ width: '180px', height: '180px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      없음
                    </div>
                  )}
                </div>

                {/* 개체 ID + 정보 */}
                <div className="flex flex-col items-center gap-2.5">
                  {/* 개체 ID - 클릭 시 복사 */}
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-2 group active:scale-95 transition-transform"
                  >
                    <span className="text-[26px] font-bold text-gray-900 tracking-tight leading-none">{animal.uniqueId}</span>
                    {copied
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <Copy className="w-4 h-4 text-gray-400 shrink-0" />
                    }
                  </button>

                  {/* 뱃지 + 해칭일 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {speciesCode && (
                        <Badge key={speciesCode.code.id} variant="secondary" className="text-sm">
                          {speciesCode.code.name}
                        </Badge>
                      )}
                      {morphCodes.map((c) => (
                        <Badge key={c.code.id} variant="outline" className="text-sm">
                          {c.code.name}
                        </Badge>
                      ))}
                    </div>
                    {animal.hatchDate && (
                      <p className="text-sm text-gray-400">
                        {format(new Date(animal.hatchDate), 'yyyy년 M월 d일', { locale: ko })} 해칭
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-col gap-2 shrink-0">
                {mode === 'select' ? (
                  <button
                    onClick={() => {
                      if (animal) {
                        onAnimalSelect?.({ id: animal.id, uniqueId: animal.uniqueId, name: animal.name, gender: animal.gender, acquisitionDate: animal.acquisitionDate })
                        handleOpenChange(false)
                      }
                    }}
                    className="w-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 rounded-2xl px-5 py-4 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-white text-[15px]">분양에 추가</span>
                    <ChevronRight className="w-4 h-4 text-white/40 ml-auto shrink-0" />
                  </button>
                ) : (
                  <>
                    {/* Primary */}
                    <button
                      onClick={handleViewDetail}
                      className="w-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 rounded-2xl px-5 py-4 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-white text-[15px]">개체 상세 보기</span>
                    </button>

                    {/* Secondary: 분할 버튼 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleOpenChange(false)
                          router.push(`/feeding-calendar?uniqueId=${animal?.uniqueId}`)
                        }}
                        className="flex-1 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                          <CalendarDays className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-[15px] font-semibold text-gray-700">피딩 캘린더</span>
                      </button>

                      <button
                        onClick={() => {
                          handleOpenChange(false)
                          router.push(`/sales?uniqueId=${animal?.uniqueId}`)
                        }}
                        className="flex-1 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-[15px] font-semibold text-gray-700">판매이력</span>
                      </button>
                    </div>
                  </>
                )}

                {/* 다시 스캔 - 미니멀 텍스트 버튼 */}
                <button
                  onClick={handleRescan}
                  className="w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors"
                >
                  <ScanLine className="w-4 h-4" />
                  <span className="text-sm font-medium">다시 스캔하기</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
