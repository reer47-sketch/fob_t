'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { updateAnimalAppearanceInfo } from '@/actions/animals/update-animal-appearance-info'
import { getTraitsAndColorsBySpeciesId } from '@/actions/codes/get-codes-by-species'
import { Quality } from '@prisma/client'

interface AnimalDetail {
  currentSize?: string | null
  tailStatus?: string | null
  patternType?: string | null
  quality?: Quality | null
  isMating: boolean
  distinctiveMarks?: string | null
  healthStatus?: string | null
  specialNeeds?: string | null
}

interface AnimalCode {
  isPrimary: boolean
  code: {
    id: string
    category: string
    code: string
    name: string
  }
}

interface AnimalDetailedInfoProps {
  animalId: string
  detail: AnimalDetail | null
  codes?: AnimalCode[]
  onUpdate?: () => void
}

interface CodeOption {
  id: string
  name: string
}

// InfoRow를 컴포넌트 외부로 이동하여 리렌더링 시 재생성 방지
const InfoRow = ({
  label,
  value,
  editable = false,
  children,
}: {
  label: string
  value: string | React.ReactNode
  editable?: boolean
  children?: React.ReactNode
}) => (
  <div className="flex items-center py-1.5">
    <span className="text-sm text-muted-foreground min-w-[100px] shrink-0">
      {label}
    </span>
    {children || <div className="text-sm font-medium">{value}</div>}
  </div>
)

export function AnimalDetailedInfo({
  animalId,
  detail,
  codes = [],
  onUpdate,
}: AnimalDetailedInfoProps) {
  // 코드 카테고리별로 분류
  const species = codes.find((c) => c.code.category === 'SPECIES')?.code
  const primaryMorph = codes.find((c) => c.code.category === 'MORPH' && c.isPrimary)?.code
  const comboMorphs = codes.filter((c) => c.code.category === 'MORPH' && !c.isPrimary).map((c) => c.code)
  const traits = codes.filter((c) => c.code.category === 'TRAIT').map((c) => c.code)
  const colors = codes.filter((c) => c.code.category === 'COLOR').map((c) => c.code)
  console.log(codes)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 편집 상태
  const [editedTraitIds, setEditedTraitIds] = useState<string[]>([])
  const [editedColorIds, setEditedColorIds] = useState<string[]>([])
  const [editedComboMorphIds, setEditedComboMorphIds] = useState<string[]>([])
  const [editedCurrentSize, setEditedCurrentSize] = useState('')
  const [editedTailStatus, setEditedTailStatus] = useState('')
  const [editedPatternType, setEditedPatternType] = useState('')
  const [editedDistinctiveMarks, setEditedDistinctiveMarks] = useState('')
  const [editedQuality, setEditedQuality] = useState<Quality | null>(null)
  const [editedIsMating, setEditedIsMating] = useState(false)
  const [editedHealthStatus, setEditedHealthStatus] = useState('')
  const [editedSpecialNeeds, setEditedSpecialNeeds] = useState('')

  // 코드 옵션 목록
  const [availableTraits, setAvailableTraits] = useState<CodeOption[]>([])
  const [availableColors, setAvailableColors] = useState<CodeOption[]>([])
  const [availableMorphs, setAvailableMorphs] = useState<CodeOption[]>([])

  // 종에 따른 모프/형질/색깔 옵션 로드
  useEffect(() => {
    if (species?.id && isEditing) {
      getTraitsAndColorsBySpeciesId(species.id).then((result) => {
        if (result.success && result.data) {
          setAvailableMorphs(result.data.morphs)
          setAvailableTraits(result.data.traits)
          setAvailableColors(result.data.colors)
        }
      })
    }
  }, [species?.id, isEditing])

  const handleEdit = () => {
    setIsEditing(true)
    // 현재 값으로 초기화
    setEditedComboMorphIds(comboMorphs.map(m => m.id))
    setEditedTraitIds(traits.map(t => t.id))
    setEditedColorIds(colors.map(c => c.id))
    setEditedCurrentSize(detail?.currentSize || '')
    setEditedTailStatus(detail?.tailStatus || '')
    setEditedPatternType(detail?.patternType || '')
    setEditedDistinctiveMarks(detail?.distinctiveMarks || '')
    setEditedQuality(detail?.quality ?? null)
    setEditedIsMating(detail?.isMating || false)
    setEditedHealthStatus(detail?.healthStatus || '')
    setEditedSpecialNeeds(detail?.specialNeeds || '')
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateAnimalAppearanceInfo({
        id: animalId,
        comboMorphIds: editedComboMorphIds,
        traitIds: editedTraitIds,
        colorIds: editedColorIds,
        currentSize: editedCurrentSize || null,
        tailStatus: editedTailStatus || null,
        patternType: editedPatternType || null,
        distinctiveMarks: editedDistinctiveMarks || null,
        quality: editedQuality,
        isMating: editedIsMating,
        healthStatus: editedHealthStatus || null,
        specialNeeds: editedSpecialNeeds || null,
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

  return (
    <div className="space-y-4">
      {/* 개체 정보 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold min-w-0">개체 정보</h3>
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
          {/* 종 - 수정 불가 */}
          <InfoRow
            label="종"
            value={
              species ? (
                <Badge variant="secondary">{species.name}</Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )
            }
          />

          {/* 모프 - 수정 불가 */}
          <InfoRow
            label="모프"
            value={
              primaryMorph ? (
                <Badge variant="outline" className="text-xs">
                  {primaryMorph.name}
                </Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )
            }
          />

          {/* 콤보 모프 - 수정 가능 (복수 선택) */}
          <InfoRow label="콤보 모프" value="" editable>
            {isEditing ? (
              <div className="flex flex-wrap gap-1">
                {availableMorphs.length > 0 ? (
                  availableMorphs
                    .filter(morph => morph.id !== primaryMorph?.id) // 대표 모프 제외
                    .map((morph) => (
                      <Badge
                        key={morph.id}
                        variant={
                          editedComboMorphIds.includes(morph.id) ? 'default' : 'outline'
                        }
                        className={cn(
                          'text-xs cursor-pointer',
                          editedComboMorphIds.includes(morph.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => {
                          setEditedComboMorphIds(prev =>
                            prev.includes(morph.id)
                              ? prev.filter(id => id !== morph.id)
                              : [...prev, morph.id]
                          )
                        }}
                      >
                        {morph.name}
                      </Badge>
                    ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    선택 가능한 콤보 모프가 없습니다
                  </span>
                )}
              </div>
            ) : comboMorphs.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {comboMorphs.map((morph) => (
                  <Badge key={morph.id} variant="outline" className="text-xs">
                    {morph.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </InfoRow>

          {/* 형질 - 수정 가능 (복수 선택) */}
          <InfoRow label="형질" value="" editable>
            {isEditing ? (
              <div className="flex flex-wrap gap-1">
                {availableTraits.length > 0 ? (
                  availableTraits.map((trait) => (
                    <Badge
                      key={trait.id}
                      variant={
                        editedTraitIds.includes(trait.id) ? 'default' : 'outline'
                      }
                      className={cn(
                        'text-xs cursor-pointer',
                        editedTraitIds.includes(trait.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => {
                        setEditedTraitIds(prev =>
                          prev.includes(trait.id)
                            ? prev.filter(id => id !== trait.id)
                            : [...prev, trait.id]
                        )
                      }}
                    >
                      {trait.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    선택 가능한 형질이 없습니다
                  </span>
                )}
              </div>
            ) : traits.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {traits.map((trait) => (
                  <Badge key={trait.id} variant="outline" className="text-xs">
                    {trait.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </InfoRow>

          {/* 색깔 - 수정 가능 (복수 선택) */}
          <InfoRow label="색깔" value="" editable>
            {isEditing ? (
              <div className="flex flex-wrap gap-1">
                {availableColors.length > 0 ? (
                  availableColors.map((color) => (
                    <Badge
                      key={color.id}
                      variant={
                        editedColorIds.includes(color.id) ? 'default' : 'outline'
                      }
                      className={cn(
                        'text-xs cursor-pointer',
                        editedColorIds.includes(color.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => {
                        setEditedColorIds(prev =>
                          prev.includes(color.id)
                            ? prev.filter(id => id !== color.id)
                            : [...prev, color.id]
                        )
                      }}
                    >
                      {color.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    선택 가능한 색깔이 없습니다
                  </span>
                )}
              </div>
            ) : colors.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {colors.map((color) => (
                  <Badge key={color.id} variant="outline" className="text-xs">
                    {color.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </InfoRow>

          {/* 현재 크기 */}
          <InfoRow label="현재 크기" value={detail?.currentSize || '-'} editable>
            {isEditing ? (
              <Input
                type="text"
                value={editedCurrentSize}
                onChange={(e) => setEditedCurrentSize(e.target.value)}
                placeholder="예: 25cm / 25g"
                className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
              />
            ) : (
              <span className="text-sm font-medium">
                {detail?.currentSize || '-'}
              </span>
            )}
          </InfoRow>

          {/* 꼬리 상태 */}
          <InfoRow label="꼬리 상태" value={detail?.tailStatus || '-'} editable>
            {isEditing ? (
              <Input
                type="text"
                value={editedTailStatus}
                onChange={(e) => setEditedTailStatus(e.target.value)}
                placeholder="예: 꼬리 유/무"
                className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
              />
            ) : (
              <span className="text-sm font-medium">
                {detail?.tailStatus || '-'}
              </span>
            )}
          </InfoRow>

          {/* 무늬 유형 */}
          <InfoRow label="무늬 유형" value={detail?.patternType || '-'} editable>
            {isEditing ? (
              <Input
                type="text"
                value={editedPatternType}
                onChange={(e) => setEditedPatternType(e.target.value)}
                placeholder="예: SPT/모자이크/마블링/보바 등"
                className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
              />
            ) : (
              <span className="text-sm font-medium">
                {detail?.patternType || '-'}
              </span>
            )}
          </InfoRow>

          {/* 특이사항 */}
          {(detail?.distinctiveMarks || isEditing) && (
            <InfoRow
              label="특이사항"
              value={detail?.distinctiveMarks || '-'}
              editable
            >
              {isEditing ? (
                <Input
                  type="text"
                  value={editedDistinctiveMarks}
                  onChange={(e) => setEditedDistinctiveMarks(e.target.value)}
                  placeholder="입양개체의 부모 정보 등"
                  className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
                />
              ) : (
                <span className="text-sm font-medium">
                  {detail?.distinctiveMarks || '-'}
                </span>
              )}
            </InfoRow>
          )}

          {/* 퀄리티 */}
          <InfoRow label="퀄리티" value={detail?.quality || '-'} editable>
            {isEditing ? (
              <Select
                value={editedQuality ?? 'NONE'}
                onValueChange={(value) => {
                  if (value === 'NONE') {
                    setEditedQuality(null)
                  } else if (value === 'S' || value === 'A' || value === 'B' || value === 'C') {
                    setEditedQuality(value)
                  }
                }}
              >
                <SelectTrigger className="h-auto w-auto px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm gap-1" size="sm">
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">선택 안함</SelectItem>
                  <SelectItem value="S">S등급</SelectItem>
                  <SelectItem value="A">A등급</SelectItem>
                  <SelectItem value="B">B등급</SelectItem>
                  <SelectItem value="C">C등급</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium inline-flex items-center gap-1">
                {detail?.quality ? `${detail.quality}등급` : '-'}
                <span className="opacity-0">▼</span>
              </span>
            )}
          </InfoRow>
        </div>
      </div>

      {/* 개체 건강 정보 */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold mb-3">개체 건강 정보</h3>
        <div className="space-y-0.5">
          {/* 건강 상태 */}
          {(detail?.healthStatus || isEditing) && (
            <InfoRow
              label="건강 상태"
              value={detail?.healthStatus || '-'}
              editable
            >
              {isEditing ? (
                <Input
                  type="text"
                  value={editedHealthStatus}
                  onChange={(e) => setEditedHealthStatus(e.target.value)}
                  placeholder="건강 상태"
                  className="h-auto text-sm px-0 py-0 border-none shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 rounded-sm"
                />
              ) : (
                <span className="text-sm font-medium">
                  {detail?.healthStatus || '-'}
                </span>
              )}
            </InfoRow>
          )}

          {/* 프루븐 */}
          <InfoRow
            label="프루븐"
            value={detail?.isMating ? '✓' : ''}
            editable
          >
            {isEditing ? (
              <Checkbox
                checked={editedIsMating}
                onCheckedChange={(checked) => setEditedIsMating(checked === true)}
                className="h-4 w-4"
              />
            ) : (
              <span className="text-sm font-medium">
                {detail?.isMating ? '✓' : ''}
              </span>
            )}
          </InfoRow>
        </div>
      </div>
    </div>
  )
}
