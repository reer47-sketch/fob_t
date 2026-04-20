'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Gender, AcquisitionType } from '@prisma/client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Clock } from 'lucide-react'
import { getSpeciesAction } from '@/actions/codes/get-species'
import { getChildCodesAction } from '@/actions/codes/get-child-codes'
import { cn } from '@/lib/utils'

interface Code {
  id: string
  code: string
  name: string
  category?: string
}

interface Step3BasicInfoProps {
  name: string
  gender: Gender | null
  acquisitionType: AcquisitionType | null
  capturedAt: Date | null
  hatchDate: Date | null
  speciesId: string | null
  primaryMorphId: string | null
  comboMorphIds: string[]
  isBreeding: boolean
  onNameChange: (value: string) => void
  onGenderChange: (value: Gender) => void
  onAcquisitionTypeChange: (value: AcquisitionType) => void
  onHatchDateChange: (value: Date | null) => void
  onSpeciesChange: (value: string) => void
  onPrimaryMorphChange: (value: string) => void
  onComboMorphsChange: (value: string[]) => void
  onIsBreedingChange: (value: boolean) => void
  onSpeciesListChange: (list: Code[]) => void
  onMorphListChange: (list: Code[]) => void
}

export function Step3BasicInfo({
  name,
  gender,
  acquisitionType,
  capturedAt,
  hatchDate,
  speciesId,
  primaryMorphId,
  comboMorphIds,
  isBreeding,
  onNameChange,
  onGenderChange,
  onAcquisitionTypeChange,
  onHatchDateChange,
  onSpeciesChange,
  onPrimaryMorphChange,
  onComboMorphsChange,
  onIsBreedingChange,
  onSpeciesListChange,
  onMorphListChange,
}: Step3BasicInfoProps) {
  const [speciesList, setSpeciesList] = useState<Code[]>([])
  const [morphList, setMorphList] = useState<Code[]>([])
  const [loadingSpecies, setLoadingSpecies] = useState(false)
  const [loadingMorphs, setLoadingMorphs] = useState(false)

  // 종 목록 로드
  useEffect(() => {
    async function loadSpecies() {
      setLoadingSpecies(true)
      try {
        const result = await getSpeciesAction()
        if (result.success && result.data) {
          setSpeciesList(result.data)
          onSpeciesListChange(result.data)
        }
      } catch (error) {
        console.error('Failed to load species:', error)
      } finally {
        setLoadingSpecies(false)
      }
    }
    loadSpecies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 종이 변경되면 모프 목록 로드
  useEffect(() => {
    async function loadMorphs() {
      if (!speciesId) {
        setMorphList([])
        onMorphListChange([])
        return
      }

      setLoadingMorphs(true)
      try {
        const result = await getChildCodesAction(speciesId)
        if (result.success && result.data) {
          // morphs 배열 사용
          setMorphList(result.data.morphs)
          onMorphListChange(result.data.morphs)
        }
      } catch (error) {
        console.error('Failed to load morphs:', error)
      } finally {
        setLoadingMorphs(false)
      }
    }
    loadMorphs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesId])

  return (
    <div className="space-y-4">

      {/* 이름 */}
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          placeholder="개체 이름을 입력하세요"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      {/* 성별 */}
      <div className="space-y-2">
        <Label>성별 *</Label>
        <Select
          value={gender || undefined}
          onValueChange={(value) => onGenderChange(value as Gender)}
        >
          <SelectTrigger>
            <SelectValue placeholder="성별을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">수컷</SelectItem>
            <SelectItem value="FEMALE">암컷</SelectItem>
            <SelectItem value="UNKNOWN">미구분</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 입양/해칭 */}
      <div className="space-y-2">
        <Label>입양/해칭 *</Label>
        <Select
          value={acquisitionType || undefined}
          onValueChange={(value) =>
            onAcquisitionTypeChange(value as AcquisitionType)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="입양/해칭을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADOPTION">입양</SelectItem>
            <SelectItem value="HATCHING">해칭</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 사진 촬영 일시 (자동 설정, 수정 불가) */}
      <div className="space-y-2">
        <Label>사진 촬영 일시</Label>
        <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {capturedAt
              ? format(capturedAt, 'yyyy년 MM월 dd일 HH:mm:ss')
              : '알 수 없음'}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          * 사진 촬영 일시는 자동으로 설정되며 수정할 수 없습니다.
        </p>
      </div>

      {/* 등록일 (사진 촬영 일시 기반, 수정 불가) */}
      <div className="space-y-2">
        <Label>등록일 *</Label>
        <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {capturedAt
              ? format(capturedAt, 'yyyy년 MM월 dd일')
              : '알 수 없음'}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          * 등록일는 사진 촬영 일시를 기준으로 자동 설정되며 수정할 수 없습니다.
        </p>
      </div>

      {/* 해칭일 (입양/해칭 모두 표시) */}
      <div className="space-y-2">
        <Label>해칭 일</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !hatchDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {hatchDate ? (
                format(hatchDate, 'yyyy년 MM월 dd일', { locale: ko })
              ) : (
                <span>날짜를 선택하세요</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={hatchDate || undefined}
              captionLayout="dropdown"
              onSelect={(date) => onHatchDateChange(date || null)}
              disabled={(date) =>
                date > new Date() || date < new Date('1900-01-01')
              }
              locale={ko}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-gray-500">
          * 해칭일을 알고 있는 경우 입력하세요 (선택 사항)
        </p>
      </div>

      {/* 종 선택 */}
      <div className="space-y-2">
        <Label>종 *</Label>
        {loadingSpecies ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {speciesList.map((species) => (
              <Badge
                key={species.id}
                variant={speciesId === species.id ? 'default' : 'outline'}
                className={cn(
                  'text-sm h-8 cursor-pointer',
                  speciesId === species.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => {
                  onSpeciesChange(species.id)
                  // 종이 변경되면 모프와 콤보 모프 초기화
                  onPrimaryMorphChange('')
                  onComboMorphsChange([])
                }}
              >
                {species.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 모프 선택 */}
      <div className="space-y-2">
        <Label>모프 *</Label>
        {!speciesId ? (
          <p className="text-sm text-gray-500">먼저 종을 선택하세요</p>
        ) : loadingMorphs ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {morphList.map((morph) => (
              <Badge
                key={morph.id}
                variant={primaryMorphId === morph.id ? 'default' : 'outline'}
                className={cn(
                  'text-sm h-8 cursor-pointer',
                  primaryMorphId === morph.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => {
                  onPrimaryMorphChange(morph.id)
                  // 모프가 변경되면 콤보 모프에서 해당 모프 제거
                  if (comboMorphIds.includes(morph.id)) {
                    onComboMorphsChange(comboMorphIds.filter(id => id !== morph.id))
                  }
                }}
              >
                {morph.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 콤보 모프 선택 (복수) */}
      <div className="space-y-2">
        <Label>콤보 모프</Label>
        {!speciesId || !primaryMorphId ? (
          <p className="text-sm text-gray-500">
            * 먼저 종과 모프를 선택하세요
          </p>
        ) : loadingMorphs ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {morphList
              .filter(morph => morph.id !== primaryMorphId)
              .map((morph) => (
                <Badge
                  key={morph.id}
                  variant={comboMorphIds.includes(morph.id) ? 'default' : 'outline'}
                  className={cn(
                    'text-sm h-8 cursor-pointer',
                    comboMorphIds.includes(morph.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => {
                    if (comboMorphIds.includes(morph.id)) {
                      onComboMorphsChange(comboMorphIds.filter(id => id !== morph.id))
                    } else {
                      onComboMorphsChange([...comboMorphIds, morph.id])
                    }
                  }}
                >
                  {morph.name}
                </Badge>
              ))}
            {morphList.filter(morph => morph.id !== primaryMorphId).length === 0 && (
              <span className="text-xs text-muted-foreground">
                선택 가능한 콤보 모프가 없습니다
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500">
          * 콤보 모프는 여러 개 선택할 수 있습니다
        </p>
      </div>

      {/* 브리딩 대상 */}
      <div className="space-y-2">
        <Label>브리딩 대상</Label>
        <div className="flex items-start space-x-3 rounded-md border p-4">
          <Checkbox
            id="isBreeding"
            checked={isBreeding}
            onCheckedChange={(checked) => onIsBreedingChange(checked === true)}
          />
          <div className="space-y-1 leading-none">
            <label
              htmlFor="isBreeding"
              className="text-sm font-medium cursor-pointer"
            >
              이 개체를 브리딩 대상으로 관리
            </label>
            <p className="text-xs text-gray-500">
              브리딩 계획이 있는 개체인 경우 체크하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
