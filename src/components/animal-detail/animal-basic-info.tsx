'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useState } from 'react'
import { updateAnimalBasicInfo } from '@/actions/animals/update-animal-basic-info'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Check, RotateCcw, CalendarIcon, Info, Link } from 'lucide-react'
import { toast } from 'sonner'

interface AnimalBasicInfoProps {
  animalId: string
  name: string | null
  uniqueId: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  acquisitionType: 'ADOPTION' | 'HATCHING'
  acquisitionDate: string
  hatchDate?: string | null
  deathDate?: string | null
  isPublic?: boolean
  isBreeding?: boolean
  parentPublic?: boolean
  qrLinkUrl?: string
  onUpdate?: () => void
}

// InfoRow를 컴포넌트 외부로 이동하여 리렌더링 시 재생성 방지
const InfoRow = ({
  label,
  value,
  editable = false,
  helpText,
  children
}: {
  label: string;
  value: string;
  editable?: boolean;
  helpText?: string;
  children?: React.ReactNode;
}) => (
  <div className="flex items-center py-1.5">
    <span className="text-sm text-muted-foreground min-w-[100px] shrink-0 flex items-center gap-1">
      {label}
      {helpText && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center">
              <Info className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-90 text-xs bg-blue-50 border-blue-200 p-2" side="right">
            {helpText}
          </PopoverContent>
        </Popover>
      )}
    </span>
    {children || <span className="text-sm font-medium">{value}</span>}
  </div>
)

export function AnimalBasicInfo({
  animalId,
  name,
  uniqueId,
  gender,
  acquisitionType,
  acquisitionDate,
  hatchDate,
  deathDate,
  isPublic = false,
  isBreeding = false,
  parentPublic = false,
  qrLinkUrl,
  onUpdate,
}: AnimalBasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(name)
  const [editedGender, setEditedGender] = useState(gender)
  const [editedIsPublic, setEditedIsPublic] = useState(isPublic)
  const [editedIsBreeding, setEditedIsBreeding] = useState(isBreeding)
  const [editedParentPublic, setEditedParentPublic] = useState(parentPublic)
  const [editedHatchDate, setEditedHatchDate] = useState(
    hatchDate ? format(new Date(hatchDate), 'yyyy-MM-dd') : ''
  )
  const [editedDeathDate, setEditedDeathDate] = useState(
    deathDate ? format(new Date(deathDate), 'yyyy-MM-dd') : ''
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
    setEditedName(name)
    setEditedGender(gender)
    setEditedIsPublic(isPublic)
    setEditedIsBreeding(isBreeding)
    setEditedParentPublic(parentPublic)
    setEditedHatchDate(hatchDate ? format(new Date(hatchDate), 'yyyy-MM-dd') : '')
    setEditedDeathDate(deathDate ? format(new Date(deathDate), 'yyyy-MM-dd') : '')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedName(name)
    setEditedGender(gender)
    setEditedIsPublic(isPublic)
    setEditedIsBreeding(isBreeding)
    setEditedParentPublic(parentPublic)
    setEditedHatchDate(hatchDate ? format(new Date(hatchDate), 'yyyy-MM-dd') : '')
    setEditedDeathDate(deathDate ? format(new Date(deathDate), 'yyyy-MM-dd') : '')
  }

  const handleSave = async () => {
    // 해칭일 유효성 검사
    if (editedHatchDate) {
      const hatchDateObj = new Date(editedHatchDate)
      const acquisitionDateObj = new Date(acquisitionDate)

      if (hatchDateObj > acquisitionDateObj) {
        toast.warning('유효하지 않은 날짜', {
          description: '해칭일은 등록일보다 이후일 수 없습니다.',
        })
        return
      }
    }

    // 폐사일 유효성 검사
    if (editedDeathDate) {
      const deathDateObj = new Date(editedDeathDate)
      const acquisitionDateObj = new Date(acquisitionDate)

      if (deathDateObj < acquisitionDateObj) {
        toast.warning('유효하지 않은 날짜', {
          description: '폐사일은 등록일보다 이전일 수 없습니다.',
        })
        return
      }
    }

    setIsSaving(true)
    try {
      const result = await updateAnimalBasicInfo({
        id: animalId,
        name: editedName,
        gender: editedGender,
        isPublic: editedIsPublic,
        isBreeding: editedIsBreeding,
        parentPublic: editedParentPublic,
        hatchDate: editedHatchDate ? new Date(editedHatchDate) : null,
        deathDate: editedDeathDate ? new Date(editedDeathDate) : null,
      })

      if (result.success) {
        toast.success('저장 완료', {
          description: '개체 정보가 업데이트되었습니다.',
        })
        setIsEditing(false)
        onUpdate?.()
      } else {
        toast.warning('저장 실패', {
          description: result.error || '개체 정보 업데이트에 실패했습니다.',
        })
      }
    } catch (error) {
      toast.warning('저장 실패', {
        description: '개체 정보 업데이트 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const genderToText = (g: 'MALE' | 'FEMALE' | 'UNKNOWN') => {
    return g === 'MALE' ? '수컷' : g === 'FEMALE' ? '암컷' : '미구분'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold min-w-0">기본 정보</h3>
        {!isEditing ? (
          <div className="flex gap-1 shrink-0">
            {qrLinkUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  try {
                    if (navigator.share) {
                      await navigator.share({ url: qrLinkUrl })
                    } else {
                      await navigator.clipboard.writeText(qrLinkUrl)
                      toast.success('링크가 복사되었습니다')
                    }
                  } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') return
                    toast.error('공유에 실패했습니다')
                  }
                }}
                className="h-7 w-7"
              >
                <Link className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-7 w-7"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-7 w-7"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 w-7"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <InfoRow label="개체명" value={name || '이름 없음'} editable>
          {isEditing ? (
            <Input
              type="text"
              value={editedName || ''}
              onChange={(e) => setEditedName(e.target.value || null)}
              className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
              autoFocus
            />
          ) : (
            <span className="text-sm font-medium">{name || '이름 없음'}</span>
          )}
        </InfoRow>

        <InfoRow label="고유개체ID" value={uniqueId} />

        <InfoRow label="성별" value={genderToText(gender)} editable>
          {isEditing ? (
            <Select
              value={editedGender}
              onValueChange={(value) => setEditedGender(value as 'MALE' | 'FEMALE' | 'UNKNOWN')}
            >
              <SelectTrigger className="h-auto w-auto px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm gap-1" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">수컷</SelectItem>
                <SelectItem value="FEMALE">암컷</SelectItem>
                <SelectItem value="UNKNOWN">미구분</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm font-medium inline-flex items-center gap-1">
              {genderToText(gender)}
              <span className="opacity-0">▼</span>
            </span>
          )}
        </InfoRow>

        <InfoRow
          label="입양/해칭"
          value={acquisitionType === 'ADOPTION' ? '입양' : '해칭'}
        />

        {/* 등록일 표시 */}
        <InfoRow
          label="등록일"
          value={format(new Date(acquisitionDate), 'yyyy-MM-dd')}
        />

        {/* 해칭일 - 모든 경우에 수정 가능 */}
        <InfoRow
          label="해칭일"
          value={hatchDate ? format(new Date(hatchDate), 'yyyy-MM-dd') : '-'}
          editable
        >
          {isEditing ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 text-sm font-medium hover:bg-muted/50 px-0 py-0 rounded-sm">
                  <span className={editedHatchDate ? '' : 'text-muted-foreground'}>
                    {editedHatchDate || 'YYYY-MM-DD'}
                  </span>
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ko}
                  selected={editedHatchDate ? new Date(editedHatchDate) : undefined}
                  onSelect={(date) => {
                    setEditedHatchDate(date ? format(date, 'yyyy-MM-dd') : '')
                  }}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-sm font-medium">
              {hatchDate ? format(new Date(hatchDate), 'yyyy-MM-dd') : '-'}
            </span>
          )}
        </InfoRow>

        {/* 폐사일 */}
        <InfoRow
          label="폐사일"
          value={deathDate ? format(new Date(deathDate), 'yyyy-MM-dd') : '-'}
          editable
        >
          {isEditing ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 text-sm font-medium hover:bg-muted/50 px-0 py-0 rounded-sm">
                  <span className={editedDeathDate ? '' : 'text-muted-foreground'}>
                    {editedDeathDate || 'YYYY-MM-DD'}
                  </span>
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ko}
                  selected={editedDeathDate ? new Date(editedDeathDate) : undefined}
                  onSelect={(date) => {
                    setEditedDeathDate(date ? format(date, 'yyyy-MM-dd') : '')
                  }}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-sm font-medium">
              {deathDate ? format(new Date(deathDate), 'yyyy-MM-dd') : '-'}
            </span>
          )}
        </InfoRow>

        {/* 공개여부 */}
        <InfoRow
          label="공개여부"
          value={isPublic ? '✓' : ''}
          editable
        >
          {isEditing ? (
            <Checkbox
              checked={editedIsPublic}
              onCheckedChange={(checked) => setEditedIsPublic(checked === true)}
              className="h-4 w-4"
            />
          ) : (
            <span className="text-sm font-medium">
              {isPublic ? '✓' : ''}
            </span>
          )}
        </InfoRow>

        {/* 브리딩 대상 */}
        <InfoRow
          label="브리딩 대상"
          value={isBreeding ? '✓' : ''}
          editable
          helpText="브리딩 대상으로 체크된 개체만 다른 개체의 부모로 선택할 수 있습니다."
        >
          {isEditing ? (
            <Checkbox
              checked={editedIsBreeding}
              onCheckedChange={(checked) => setEditedIsBreeding(checked === true)}
              className="h-4 w-4"
            />
          ) : (
            <span className="text-sm font-medium">
              {isBreeding ? '✓' : ''}
            </span>
          )}
        </InfoRow>

        {/* 부모 공개여부 */}
        <InfoRow
          label="부모 공개여부"
          value={parentPublic ? '✓' : ''}
          editable
          helpText="Guest 페이지에서 이 개체의 부모 정보 공개 여부를 설정합니다."
        >
          {isEditing ? (
            <Checkbox
              checked={editedParentPublic}
              onCheckedChange={(checked) => setEditedParentPublic(checked === true)}
              className="h-4 w-4"
            />
          ) : (
            <span className="text-sm font-medium">
              {parentPublic ? '✓' : ''}
            </span>
          )}
        </InfoRow>
      </div>
    </div>
  )
}
