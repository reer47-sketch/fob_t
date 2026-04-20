'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Check, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { updateAnimalHabitatInfo } from '@/actions/animals/update-animal-habitat-info'

interface AnimalDetail {
  cageInfo?: string | null
  flooringInfo?: string | null
  habitatNotes?: string | null
}

interface AnimalHabitatInfoProps {
  animalId: string
  detail: AnimalDetail | null
  onUpdate?: () => void
}

// InfoRow를 컴포넌트 외부로 이동하여 리렌더링 시 재생성 방지
const InfoRow = ({
  label,
  value,
  editable = false,
  children,
}: {
  label: string
  value: string
  editable?: boolean
  children?: React.ReactNode
}) => (
  <div className="flex items-start py-1.5">
    <span className="text-sm text-muted-foreground min-w-[100px] shrink-0">
      {label}
    </span>
    {children || <span className="text-sm font-medium">{value}</span>}
  </div>
)

export function AnimalHabitatInfo({ animalId, detail, onUpdate }: AnimalHabitatInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 편집 상태
  const [editedCageInfo, setEditedCageInfo] = useState('')
  const [editedFlooringInfo, setEditedFlooringInfo] = useState('')
  const [editedHabitatNotes, setEditedHabitatNotes] = useState('')

  const handleEdit = () => {
    setIsEditing(true)
    // 현재 값으로 초기화
    setEditedCageInfo(detail?.cageInfo || '')
    setEditedFlooringInfo(detail?.flooringInfo || '')
    setEditedHabitatNotes(detail?.habitatNotes || '')
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateAnimalHabitatInfo({
        id: animalId,
        cageInfo: editedCageInfo || null,
        flooringInfo: editedFlooringInfo || null,
        habitatNotes: editedHabitatNotes || null,
      })

      if (result.success) {
        toast.success('저장 완료', {
          description: '서식지 정보가 업데이트되었습니다.',
        })
        setIsEditing(false)
        onUpdate?.()
      } else {
        toast.warning('저장 실패', {
          description: result.error || '서식지 정보 업데이트에 실패했습니다.',
        })
      }
    } catch (error) {
      toast.warning('저장 실패', {
        description: '서식지 정보 업데이트 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold min-w-0">서식지 정보</h3>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-7 w-7 shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
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
        <InfoRow label="케이지 정보" value={detail?.cageInfo || '-'} editable>
          {isEditing ? (
            <Input
              type="text"
              value={editedCageInfo}
              onChange={(e) => setEditedCageInfo(e.target.value)}
              placeholder="케이지 정보"
              className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
            />
          ) : (
            <span className="text-sm font-medium">{detail?.cageInfo || '-'}</span>
          )}
        </InfoRow>
        <InfoRow label="바닥재 정보" value={detail?.flooringInfo || '-'} editable>
          {isEditing ? (
            <Input
              type="text"
              value={editedFlooringInfo}
              onChange={(e) => setEditedFlooringInfo(e.target.value)}
              placeholder="바닥재 정보"
              className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
            />
          ) : (
            <span className="text-sm font-medium">{detail?.flooringInfo || '-'}</span>
          )}
        </InfoRow>
        <InfoRow label="기타 사항" value={detail?.habitatNotes || '-'} editable>
          {isEditing ? (
            <Input
              type="text"
              value={editedHabitatNotes}
              onChange={(e) => setEditedHabitatNotes(e.target.value)}
              placeholder="기타 사항"
              className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
            />
          ) : (
            <span className="text-sm font-medium">{detail?.habitatNotes || '-'}</span>
          )}
        </InfoRow>
      </div>
    </div>
  )
}
