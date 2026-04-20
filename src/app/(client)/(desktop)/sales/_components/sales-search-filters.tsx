'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, RotateCcw } from 'lucide-react'
import { getSpeciesAction } from '@/actions/codes/get-species'
import { getChildCodesAction } from '@/actions/codes/get-child-codes'
import type { Gender } from '@prisma/client'
import type { SalesAnimal } from '@/services/sales-service'
import { PdfDownloadButton } from './pdf-download-button'

export interface SearchFilters {
  speciesId?: string
  morphIds?: string[]
  traitIds?: string[]
  gender?: Gender
  minPrice?: number
  maxPrice?: number
  isReported?: boolean
  yearMonth?: string // YYYY-MM 형식
  uniqueId?: string
}

interface CodeItem {
  id: string
  code: string
  name: string
}

interface SalesSearchFiltersProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
  onRefresh: () => void
  animals: SalesAnimal[]
  loading: boolean
  total: number
  filters: SearchFilters
  initialFilters?: SearchFilters
}

export function SalesSearchFilters({ onSearch, onReset, onRefresh, animals, loading, total, filters: appliedSearchFilters, initialFilters = {} }: SalesSearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters)
  const [isOpen, setIsOpen] = useState(false)

  // 코드 데이터
  const [species, setSpecies] = useState<CodeItem[]>([])
  const [morphs, setMorphs] = useState<CodeItem[]>([])
  const [traits, setTraits] = useState<CodeItem[]>([])

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
        // 종이 선택 해제되면 2뎁스도 모두 초기화
        setFilters(prev => ({
          ...prev,
          morphIds: [],
          traitIds: [],
        }))
        return
      }

      const result = await getChildCodesAction(filters.speciesId)
      if (result.success && result.data) {
        setMorphs(result.data.morphs)
        setTraits(result.data.traits)
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
    key: 'morphIds' | 'traitIds',
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
    }))
  }

  const getFilterSummary = () => {
    const summary: string[] = []

    // 분양 월 필터
    if (appliedFilters.yearMonth) {
      summary.push(`분양 월: ${appliedFilters.yearMonth}`)
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

    if (appliedFilters.gender) {
      const genderText = appliedFilters.gender === 'MALE' ? '수컷' :
                        appliedFilters.gender === 'FEMALE' ? '암컷' : '미확인'
      summary.push(`성별: ${genderText}`)
    }

    if (appliedFilters.minPrice !== undefined || appliedFilters.maxPrice !== undefined) {
      const min = appliedFilters.minPrice?.toLocaleString() || '0'
      const max = appliedFilters.maxPrice?.toLocaleString() || '∞'
      summary.push(`금액: ${min}원 ~ ${max}원`)
    }

    if (appliedFilters.isReported !== undefined) {
      summary.push(`신고: ${appliedFilters.isReported ? '완료' : '신고 대기'}`)
    }

    if (appliedFilters.uniqueId) {
      summary.push(`ID/이름: ${appliedFilters.uniqueId}`)
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

      {/* 우측: 필터 버튼 + PDF 다운로드 버튼 */}
      <div className="flex items-center gap-2">
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

            {/* 개체 ID/이름 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ID/이름
              </label>
              <Input
                placeholder="ID 또는 이름 검색"
                value={filters.uniqueId || ''}
                onChange={(e) => updateFilter('uniqueId', e.target.value || undefined)}
                className="h-9"
              />
            </div>

            {/* 분양 월 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                분양 월 (YYYY-MM)
              </label>
              <Input
                type="month"
                placeholder="YYYY-MM"
                value={filters.yearMonth || ''}
                onChange={(e) => updateFilter('yearMonth', e.target.value || undefined)}
                className="h-9"
              />
            </div>

            {/* 성별, 양수양도 신고 */}
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

              {/* 양수양도 신고 여부 */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">
                  양수양도 신고
                </label>
                <Select
                  value={filters.isReported === undefined ? 'ALL' : filters.isReported.toString()}
                  onValueChange={(value) =>
                    updateFilter('isReported', value === 'ALL' ? undefined : value === 'true')
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="true">신고완료</SelectItem>
                    <SelectItem value="false">신고 대기</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 금액 범위 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                금액 범위
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="최소 금액"
                  value={filters.minPrice ? filters.minPrice.toLocaleString() : ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^\d]/g, '')
                    updateFilter('minPrice', numericValue ? Number(numericValue) : undefined)
                  }}
                  className="h-9"
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="최대 금액"
                  value={filters.maxPrice ? filters.maxPrice.toLocaleString() : ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^\d]/g, '')
                    updateFilter('maxPrice', numericValue ? Number(numericValue) : undefined)
                  }}
                  className="h-9"
                />
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

        <PdfDownloadButton
          type="yangsu"
          totalCount={total}
          disabled={loading || total === 0}
          filters={appliedSearchFilters}
          onRefresh={onRefresh}
        />
        <PdfDownloadButton
          type="yangdo"
          totalCount={total}
          disabled={loading || total === 0}
          filters={appliedSearchFilters}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}
