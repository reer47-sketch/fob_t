'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { CalendarIcon, Search, RotateCcw } from 'lucide-react'
import { Gender, AcquisitionType } from '@prisma/client'
import { getSpeciesAction } from '@/actions/codes/get-species'
import { getChildCodesAction } from '@/actions/codes/get-child-codes'

export interface SearchFilters {
  uniqueId?: string
  acquisitionDateFrom?: string
  acquisitionDateTo?: string
  hatchingDateFrom?: string
  hatchingDateTo?: string
  speciesId?: string
  morphIds?: string[]
  traitIds?: string[]
  colorIds?: string[]
  gender?: Gender
  parentId?: string
  acquisitionType?: AcquisitionType
  isBreeding?: boolean
  isAdopted?: boolean
  adoptionDateFrom?: string
  adoptionDateTo?: string
}

interface CodeItem {
  id: string
  code: string
  name: string
}

interface AnimalSearchFiltersProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
}

export function AnimalSearchFilters({ onSearch, onReset }: AnimalSearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({})
  const [isOpen, setIsOpen] = useState(false)

  // 코드 데이터
  const [species, setSpecies] = useState<CodeItem[]>([])
  const [morphs, setMorphs] = useState<CodeItem[]>([])
  const [traits, setTraits] = useState<CodeItem[]>([])
  const [colors, setColors] = useState<CodeItem[]>([])

  // 종 목록 로드
  useEffect(() => {
    async function loadSpecies() {
      const result = await getSpeciesAction()
      if (result.success && result.data) {
        setSpecies(result.data)
      }
    }
    loadSpecies()
  }, [])

  // 선택된 종이 변경되면 2뎁스 코드 로드
  useEffect(() => {
    async function loadChildCodes() {
      if (!filters.speciesId) {
        setMorphs([])
        setTraits([])
        setColors([])
        // 종이 선택 해제되면 2뎁스도 모두 초기화
        setFilters(prev => ({
          ...prev,
          morphIds: [],
          traitIds: [],
          colorIds: [],
        }))
        return
      }

      const result = await getChildCodesAction(filters.speciesId)
      if (result.success && result.data) {
        setMorphs(result.data.morphs)
        setTraits(result.data.traits)
        setColors(result.data.colors)
      }
    }
    loadChildCodes()
  }, [filters.speciesId])

  const handleApply = () => {
    setAppliedFilters(filters)
    onSearch(filters)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters({})
    setAppliedFilters({})
    onReset()
    setIsOpen(false)
  }

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // 배열 필터 토글 (복수 선택)
  const toggleArrayFilter = (
    key: 'morphIds' | 'traitIds' | 'colorIds',
    id: string
  ) => {
    setFilters((prev) => {
      const current = prev[key] || []
      const isSelected = current.includes(id)

      return {
        ...prev,
        [key]: isSelected
          ? current.filter((item) => item !== id)
          : [...current, id],
      }
    })
  }

  // 종 선택 (단일 선택)
  const handleSpeciesSelect = (speciesId: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      speciesId,
      // 종이 변경되면 2뎁스 필터 초기화
      morphIds: [],
      traitIds: [],
      colorIds: [],
    }))
  }

  const formatDateInput = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '')

    // 최대 8자리까지만 허용 (YYYYMMDD)
    const limited = numbers.slice(0, 8)

    // 하이픈 자동 추가
    if (limited.length <= 4) {
      return limited
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`
    } else {
      return `${limited.slice(0, 4)}-${limited.slice(4, 6)}-${limited.slice(6)}`
    }
  }

  const handleDateInputChange = (key: 'acquisitionDateFrom' | 'acquisitionDateTo' | 'hatchingDateFrom' | 'hatchingDateTo' | 'adoptionDateFrom' | 'adoptionDateTo', value: string) => {
    const formatted = formatDateInput(value)
    updateFilter(key, formatted)
  }

  const getFilterSummary = () => {
    const summary: string[] = []

    if (appliedFilters.uniqueId) {
      summary.push(`ID/이름: ${appliedFilters.uniqueId}`)
    }

    if (appliedFilters.acquisitionDateFrom || appliedFilters.acquisitionDateTo) {
      const from = appliedFilters.acquisitionDateFrom || '시작'
      const to = appliedFilters.acquisitionDateTo || '종료'
      summary.push(`등록일: ${from} ~ ${to}`)
    }

    if (appliedFilters.hatchingDateFrom || appliedFilters.hatchingDateTo) {
      const from = appliedFilters.hatchingDateFrom || '시작'
      const to = appliedFilters.hatchingDateTo || '종료'
      summary.push(`해칭일: ${from} ~ ${to}`)
    }

    if (appliedFilters.gender) {
      const genderText = appliedFilters.gender === 'MALE' ? '수컷' :
                        appliedFilters.gender === 'FEMALE' ? '암컷' : '미확인'
      summary.push(`성별: ${genderText}`)
    }

    if (appliedFilters.acquisitionType) {
      const typeText = appliedFilters.acquisitionType === 'ADOPTION' ? '입양' : '해칭'
      summary.push(`구분: ${typeText}`)
    }

    if (appliedFilters.isBreeding !== undefined) {
      summary.push(`브리딩 대상: ${appliedFilters.isBreeding ? 'Y' : 'N'}`)
    }

    if (appliedFilters.isAdopted !== undefined) {
      const adoptionText = appliedFilters.isAdopted ? '분양' : '미분양'
      summary.push(`분양여부: ${adoptionText}`)
    }

    if (appliedFilters.adoptionDateFrom || appliedFilters.adoptionDateTo) {
      const from = appliedFilters.adoptionDateFrom || '시작'
      const to = appliedFilters.adoptionDateTo || '종료'
      summary.push(`분양일: ${from} ~ ${to}`)
    }

    // 종 필터
    if (appliedFilters.speciesId) {
      const selectedSpecies = species.find(s => s.id === appliedFilters.speciesId)
      if (selectedSpecies) {
        summary.push(`종: ${selectedSpecies.name}`)
      }
    }

    // 모프 필터
    if (appliedFilters.morphIds && appliedFilters.morphIds.length > 0) {
      summary.push(`모프: ${appliedFilters.morphIds.length}개`)
    }

    // 형질 필터
    if (appliedFilters.traitIds && appliedFilters.traitIds.length > 0) {
      summary.push(`형질: ${appliedFilters.traitIds.length}개`)
    }

    // 색깔 필터
    if (appliedFilters.colorIds && appliedFilters.colorIds.length > 0) {
      summary.push(`색깔: ${appliedFilters.colorIds.length}개`)
    }

    if (appliedFilters.parentId) {
      summary.push(`부/모 ID/이름: ${appliedFilters.parentId}`)
    }

    return summary.length > 0 ? summary.join(' | ') : '검색 조건 없음'
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {/* 좌측: 적용된 필터 조건 표시 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">
          {getFilterSummary()}
        </p>
      </div>

      {/* 우측: 필터 버튼 */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            검색
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] max-h-[80vh] overflow-y-auto pb-0" align="end">
          <div className="space-y-4 pb-2">
            <h4 className="font-semibold text-sm">검색 조건</h4>

            {/* 고유개체ID/이름 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ID/이름
              </label>
              <Input
                placeholder="ID 또는 이름 검색"
                value={filters.uniqueId || ''}
                onChange={(e) => updateFilter('uniqueId', e.target.value)}
                className="h-9"
              />
            </div>

            {/* 해칭/입양일 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                등록일
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* 시작일 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filters.acquisitionDateFrom || ''}
                        onChange={(e) => handleDateInputChange('acquisitionDateFrom', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.acquisitionDateFrom ? new Date(filters.acquisitionDateFrom) : undefined}
                      onSelect={(date) => {
                        updateFilter('acquisitionDateFrom', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {/* 종료일 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filters.acquisitionDateTo || ''}
                        onChange={(e) => handleDateInputChange('acquisitionDateTo', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.acquisitionDateTo ? new Date(filters.acquisitionDateTo) : undefined}
                      onSelect={(date) => {
                        updateFilter('acquisitionDateTo', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 해칭일 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                해칭일
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* 시작일 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filters.hatchingDateFrom || ''}
                        onChange={(e) => handleDateInputChange('hatchingDateFrom', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.hatchingDateFrom ? new Date(filters.hatchingDateFrom) : undefined}
                      onSelect={(date) => {
                        updateFilter('hatchingDateFrom', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {/* 종료일 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filters.hatchingDateTo || ''}
                        onChange={(e) => handleDateInputChange('hatchingDateTo', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.hatchingDateTo ? new Date(filters.hatchingDateTo) : undefined}
                      onSelect={(date) => {
                        updateFilter('hatchingDateTo', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 성별, 입양/해칭 */}
            <div className="grid grid-cols-2 gap-2">
              {/* 성별 */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">
                  성별
                </label>
                <Select
                  value={filters.gender || 'ALL'}
                  onValueChange={(value) => updateFilter('gender', value === 'ALL' ? undefined : value as Gender)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="MALE">수컷</SelectItem>
                    <SelectItem value="FEMALE">암컷</SelectItem>
                    <SelectItem value="UNKNOWN">미구분</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 입양/해칭 */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">
                  입양/해칭
                </label>
                <Select
                  value={filters.acquisitionType || 'ALL'}
                  onValueChange={(value) => updateFilter('acquisitionType', value === 'ALL' ? undefined : value as AcquisitionType)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="ADOPTION">입양</SelectItem>
                    <SelectItem value="HATCHING">해칭</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 브리딩 대상, 분양여부 */}
            <div className="grid grid-cols-2 gap-2">
              {/* 브리딩 대상 */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">
                  브리딩 대상
                </label>
                <Select
                  value={filters.isBreeding === undefined ? 'ALL' : filters.isBreeding.toString()}
                  onValueChange={(value) =>
                    updateFilter('isBreeding', value === 'ALL' ? undefined : value === 'true')
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="true">Y</SelectItem>
                    <SelectItem value="false">N</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 분양여부 */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">
                  분양여부
                </label>
                <Select
                  value={filters.isAdopted === undefined ? 'ALL' : filters.isAdopted.toString()}
                  onValueChange={(value) =>
                    updateFilter('isAdopted', value === 'ALL' ? undefined : value === 'true')
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="true">분양</SelectItem>
                    <SelectItem value="false">미분양</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t" />

            {/* 종 선택 (1뎁스) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                종
              </label>
              <div className="flex flex-wrap gap-2">
                {species.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    size="sm"
                    variant={filters.speciesId === item.id ? 'selectedOutline' : 'primaryOutline'}
                    onClick={() => handleSpeciesSelect(
                      filters.speciesId === item.id ? undefined : item.id
                    )}
                    className="h-6 text-xs px-2 rounded-full"
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 모프 선택 (2뎁스) */}
            {filters.speciesId && morphs.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  모프
                </label>
                <div className="flex flex-wrap gap-2">
                  {morphs.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant={filters.morphIds?.includes(item.id) ? 'selectedOutline' : 'primaryOutline'}
                      onClick={() => toggleArrayFilter('morphIds', item.id)}
                      className="h-6 text-xs px-2 rounded-full"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 형질 선택 (2뎁스) */}
            {filters.speciesId && traits.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  형질
                </label>
                <div className="flex flex-wrap gap-2">
                  {traits.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant={filters.traitIds?.includes(item.id) ? 'selectedOutline' : 'primaryOutline'}
                      onClick={() => toggleArrayFilter('traitIds', item.id)}
                      className="h-6 text-xs px-2 rounded-full"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 색깔 선택 (2뎁스) */}
            {filters.speciesId && colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  색깔
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant={filters.colorIds?.includes(item.id) ? 'selectedOutline' : 'primaryOutline'}
                      onClick={() => toggleArrayFilter('colorIds', item.id)}
                      className="h-6 text-xs px-2 rounded-full"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 구분선 */}
            <div className="border-t" />

            {/* 분양일 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                분양일
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* 시작일 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filters.adoptionDateFrom || ''}
                        onChange={(e) => handleDateInputChange('adoptionDateFrom', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.adoptionDateFrom ? new Date(filters.adoptionDateFrom) : undefined}
                      onSelect={(date) => {
                        updateFilter('adoptionDateFrom', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {/* 종료일 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filters.adoptionDateTo || ''}
                        onChange={(e) => handleDateInputChange('adoptionDateTo', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.adoptionDateTo ? new Date(filters.adoptionDateTo) : undefined}
                      onSelect={(date) => {
                        updateFilter('adoptionDateTo', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 부/모 ID/이름 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                부/모 ID/이름
              </label>
              <Input
                placeholder="부/모 ID 또는 이름 검색"
                value={filters.parentId || ''}
                onChange={(e) => updateFilter('parentId', e.target.value)}
                className="h-9"
              />
            </div>

          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-2 pt-4 pb-3 border-t sticky bottom-0 bg-popover">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="flex-1 gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              초기화
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-2"
            >
              적용하기
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
