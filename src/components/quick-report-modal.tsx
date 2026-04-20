'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, FileDown, UserCheck } from 'lucide-react'
import { generateQuickReportPdf, downloadPdf } from '@/lib/pdf-generator'
import type { QuickReportFormData } from '@/lib/pdf-generator'
import { getCurrentUser } from '@/actions/auth/get-current-user'
import { getSpeciesAction } from '@/actions/codes/get-species'
import { toast } from 'sonner'

interface Species {
  id: string
  name: string
  scientificName: string | null
}

type ReportType = 'yangsu' | 'yangdo' | 'both'

interface QuickReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INITIAL_PERSON = { name: '', address: '', phone: '' }

export function QuickReportModal({ open, onOpenChange }: QuickReportModalProps) {
  const [type, setType] = useState<ReportType>('yangdo')
  const [seller, setSeller] = useState({ ...INITIAL_PERSON })
  const [buyer, setBuyer] = useState({ ...INITIAL_PERSON })
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('')
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [quantity, setQuantity] = useState(1)
  const [transferPurpose, setTransferPurpose] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [adoptionDate, setAdoptionDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // 본인 정보 캐시
  const [myInfo, setMyInfo] = useState<{
    name: string
    phone: string
    address: string
    shopName: string
  } | null>(null)

  // 모달 열릴 때 유저 정보 + 종 목록 조회
  useEffect(() => {
    if (!open) return

    if (!myInfo) {
      getCurrentUser().then((result) => {
        if (result.success && result.data) {
          const user = result.data
          setMyInfo({
            name: user.name || '',
            phone: user.phone || '',
            address: user.tenant?.address || '',
            shopName: user.tenant?.name || '',
          })
        }
      })
    }

    if (speciesList.length === 0) {
      getSpeciesAction().then((result) => {
        if (result.success && result.data) {
          setSpeciesList(result.data as Species[])
        }
      })
    }
  }, [open, myInfo, speciesList.length])

  const selectedScientificName = speciesList.find((s) => s.id === selectedSpeciesId)?.scientificName || ''

  const fillMyInfoAsSeller = () => {
    if (!myInfo) return
    setSeller({
      name: myInfo.shopName || myInfo.name,
      address: myInfo.address,
      phone: myInfo.phone,
    })
    setReporterName(myInfo.name)
  }

  const fillMyInfoAsBuyer = () => {
    if (!myInfo) return
    setBuyer({
      name: myInfo.shopName || myInfo.name,
      address: myInfo.address,
      phone: myInfo.phone,
    })
    setReporterName(myInfo.name)
  }

  const handleGenerate = async () => {
    if (!seller.name && !buyer.name) {
      toast.error('양도인 또는 양수인 정보를 입력해주세요')
      return
    }

    setIsGenerating(true)
    try {
      const formData: QuickReportFormData = {
        type,
        seller,
        buyer,
        scientificName: selectedScientificName,
        quantity,
        transferPurpose,
        transferReason,
        reporterName,
        adoptionDate: new Date(adoptionDate),
      }

      const pdfBlob = await generateQuickReportPdf(formData)

      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const typeLabel = type === 'both' ? '양수양도신고서' : type === 'yangsu' ? '양수신고서' : '양도신고서'
      downloadPdf(pdfBlob, `${typeLabel}_${dateStr}.pdf`)

      toast.success('신고서가 다운로드되었습니다', { duration: 1000 })
      onOpenChange(false)
    } catch (error) {
      console.error('PDF 생성 실패:', error)
      toast.error('PDF 생성 중 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setType('yangdo')
    setSeller({ ...INITIAL_PERSON })
    setBuyer({ ...INITIAL_PERSON })
    setSelectedSpeciesId('')
    setQuantity(1)
    setTransferPurpose('')
    setTransferReason('')
    setReporterName('')
    setAdoptionDate(new Date().toISOString().split('T')[0])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>양수양도 신고서 빠른 출력</DialogTitle>
          <DialogDescription>
            정보를 직접 입력하고 바로 PDF를 다운로드합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* 신고 유형 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">신고 유형</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as ReportType)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="yangdo" id="type-yangdo" />
                <Label htmlFor="type-yangdo" className="font-normal cursor-pointer">양도</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="yangsu" id="type-yangsu" />
                <Label htmlFor="type-yangsu" className="font-normal cursor-pointer">양수</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="both" id="type-both" />
                <Label htmlFor="type-both" className="font-normal cursor-pointer">전체 (양수+양도)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 양도인 */}
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="text-sm font-medium px-1 flex items-center gap-2">
              양도인 (파는 사람)
              {myInfo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-muted-foreground"
                  onClick={fillMyInfoAsSeller}
                >
                  <UserCheck className="h-3 w-3" />
                  내 정보
                </Button>
              )}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">성명(상호)</Label>
                <Input
                  value={seller.name}
                  onChange={(e) => setSeller((p) => ({ ...p, name: e.target.value }))}
                  placeholder="성명 또는 상호명"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">전화번호</Label>
                <Input
                  value={seller.phone}
                  onChange={(e) => setSeller((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">주소</Label>
              <Input
                value={seller.address}
                onChange={(e) => setSeller((p) => ({ ...p, address: e.target.value }))}
                placeholder="주소"
              />
            </div>
          </fieldset>

          {/* 양수인 */}
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="text-sm font-medium px-1 flex items-center gap-2">
              양수인 (사는 사람)
              {myInfo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-muted-foreground"
                  onClick={fillMyInfoAsBuyer}
                >
                  <UserCheck className="h-3 w-3" />
                  내 정보
                </Button>
              )}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">성명(상호)</Label>
                <Input
                  value={buyer.name}
                  onChange={(e) => setBuyer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="성명 또는 상호명"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">전화번호</Label>
                <Input
                  value={buyer.phone}
                  onChange={(e) => setBuyer((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">주소</Label>
              <Input
                value={buyer.address}
                onChange={(e) => setBuyer((p) => ({ ...p, address: e.target.value }))}
                placeholder="주소"
              />
            </div>
          </fieldset>

          {/* 개체 정보 */}
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="text-sm font-medium px-1">개체 정보</legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">종</Label>
                <Select value={selectedSpeciesId} onValueChange={setSelectedSpeciesId}>
                  <SelectTrigger>
                    <SelectValue placeholder="종 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesList.map((species) => (
                      <SelectItem key={species.id} value={species.id}>
                        {species.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">수량</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">용도</Label>
                <Input
                  value={transferPurpose}
                  onChange={(e) => setTransferPurpose(e.target.value)}
                  placeholder="애완"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">양도사유</Label>
                <Input
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="분양"
                />
              </div>
            </div>
          </fieldset>

          {/* 기타 정보 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">신고인</Label>
              <Input
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="신고인 성명"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">분양일</Label>
              <Input
                type="date"
                value={adoptionDate}
                onChange={(e) => setAdoptionDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset} disabled={isGenerating}>
            초기화
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                PDF 다운로드
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
