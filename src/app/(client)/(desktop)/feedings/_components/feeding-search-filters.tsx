'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Search, RotateCcw } from 'lucide-react'
import { FoodType } from '@prisma/client'
import { AnimalSearchSelector, type AnimalInfo } from '@/components/shared/animal-search-selector'
import { Input } from '@/components/ui/input'

export interface SearchFilters {
  feedingDateFrom?: string
  feedingDateTo?: string
  foodType?: FoodType
  animalUniqueId?: string
  animalId?: string
}

interface FeedingSearchFiltersProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
}

const foodTypeLabels: Record<FoodType, string> = {
  CRICKET: '귀뚜라미',
  MEALWORM: '밀웜',
  FEED: '사료',
  VEGETABLE: '야채/과일',
  MOUSE: '쥐',
  FROZEN_CHICK: '냉짱',
  FRUIT_FLY: '초파리',
  OTHER: '기타',
}

export function FeedingSearchFilters({ onSearch, onReset }: FeedingSearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({})
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalInfo | null>(null)

  const handleApply = () => {
    setAppliedFilters(filters)
    onSearch(filters)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters({})
    setAppliedFilters({})
    setSelectedAnimal(null)
    onReset()
    setIsOpen(false)
  }

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
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

  const handleDateInputChange = (key: 'feedingDateFrom' | 'feedingDateTo', value: string) => {
    const formatted = formatDateInput(value)
    updateFilter(key, formatted)
  }

  const getFilterSummary = () => {
    const summary: string[] = []

    if (appliedFilters.feedingDateFrom || appliedFilters.feedingDateTo) {
      const from = appliedFilters.feedingDateFrom || '시작'
      const to = appliedFilters.feedingDateTo || '종료'
      summary.push(`날짜: ${from} ~ ${to}`)
    }

    if (appliedFilters.foodType) {
      summary.push(`먹이: ${foodTypeLabels[appliedFilters.foodType]}`)
    }

    if (appliedFilters.animalUniqueId || appliedFilters.animalId) {
      const displayText = appliedFilters.animalUniqueId || '개체 선택됨'
      summary.push(`개체: ${displayText}`)
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
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">검색 조건</h4>

            {/* 피딩 날짜 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                피딩 날짜
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* 시작일 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filters.feedingDateFrom || ''}
                        onChange={(e) => handleDateInputChange('feedingDateFrom', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.feedingDateFrom ? new Date(filters.feedingDateFrom) : undefined}
                      onSelect={(date) => {
                        updateFilter('feedingDateFrom', date ? format(date, 'yyyy-MM-dd') : undefined)
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
                        value={filters.feedingDateTo || ''}
                        onChange={(e) => handleDateInputChange('feedingDateTo', e.target.value)}
                        className="h-9 pr-9"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ko}
                      selected={filters.feedingDateTo ? new Date(filters.feedingDateTo) : undefined}
                      onSelect={(date) => {
                        updateFilter('feedingDateTo', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 먹이 종류 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                먹이 종류
              </label>
              <Select
                value={filters.foodType || 'ALL'}
                onValueChange={(value) => updateFilter('foodType', value === 'ALL' ? undefined : value as FoodType)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  {Object.entries(foodTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 개체 검색 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                개체 검색
              </label>
              <AnimalSearchSelector
                selectedAnimal={selectedAnimal}
                onSelect={(animal) => {
                  setSelectedAnimal(animal)
                  updateFilter('animalId', animal.id)
                  updateFilter('animalUniqueId', animal.uniqueId)
                }}
                onClear={() => {
                  setSelectedAnimal(null)
                  updateFilter('animalId', undefined)
                  updateFilter('animalUniqueId', undefined)
                }}
                placeholder="개체 ID 또는 이름으로 검색"
              />
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
