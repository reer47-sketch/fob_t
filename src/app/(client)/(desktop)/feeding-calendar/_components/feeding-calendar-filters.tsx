'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, RotateCcw, HelpCircle } from 'lucide-react'
import { FeedingBadge } from './feeding-badge'
import { FoodType } from '@prisma/client'
import { foodTypeLabels } from '@/lib/food-type-constants'

export interface FeedingCalendarFilters {
  uniqueId?: string
  year?: number
  month?: number
  foodType?: FoodType
}

interface FeedingCalendarFiltersProps {
  selectedYear: number
  selectedMonth: number
  onSearch: (filters: FeedingCalendarFilters) => void
  onReset: () => void
  onYearMonthChange: (year: number, month: number) => void
  initialFilters?: FeedingCalendarFilters
}

export function FeedingCalendarFiltersComponent({
  selectedYear,
  selectedMonth,
  onSearch,
  onReset,
  onYearMonthChange,
  initialFilters = {},
}: FeedingCalendarFiltersProps) {
  const [filters, setFilters] = useState<FeedingCalendarFilters>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<FeedingCalendarFilters>(initialFilters)
  const [isOpen, setIsOpen] = useState(false)
  const [year, setYear] = useState(selectedYear)
  const [month, setMonth] = useState(selectedMonth)

  // 연도 목록 생성 (2000년부터 현재 연도까지)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => 2000 + i).reverse()

  // 월 목록 생성 (1~12월)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // 외부에서 년/월이 변경되면 내부 상태 동기화
  useEffect(() => {
    setYear(selectedYear)
    setMonth(selectedMonth)
  }, [selectedYear, selectedMonth])

  const handleApply = () => {
    setAppliedFilters(filters)
    onSearch(filters)
    onYearMonthChange(year, month)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters({})
    setAppliedFilters({})
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    onReset()
    onYearMonthChange(now.getFullYear(), now.getMonth() + 1)
    setIsOpen(false)
  }

  const updateFilter = <K extends keyof FeedingCalendarFilters>(
    key: K,
    value: FeedingCalendarFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const getFilterSummary = () => {
    const summary: string[] = []

    // 연도/월 표시
    summary.push(`${selectedYear}년 ${selectedMonth}월`)

    if (appliedFilters.uniqueId) {
      summary.push(`ID/이름: ${appliedFilters.uniqueId}`)
    }

    if (appliedFilters.foodType) {
      summary.push(`먹이: ${foodTypeLabels[appliedFilters.foodType]}`)
    }

    return summary.join(' | ')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        {/* 좌측: 적용된 필터 조건 표시 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{getFilterSummary()}</p>
        </div>

        {/* 우측: 필터 버튼 + 도움말 */}
        <div className="flex items-center gap-2">
          {/* 도움말 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 text-blue-700 hover:text-blue-800">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs">도움말</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px]" align="end">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">먹이 배지 안내</h4>

                {/* 배지 설명 */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">배지는 먹이 종류의 첫 글자를 표시합니다</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.CRICKET} />
                      <span className="text-xs">{foodTypeLabels[FoodType.CRICKET]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.MEALWORM} />
                      <span className="text-xs">{foodTypeLabels[FoodType.MEALWORM]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.FEED} />
                      <span className="text-xs">{foodTypeLabels[FoodType.FEED]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.VEGETABLE} />
                      <span className="text-xs">{foodTypeLabels[FoodType.VEGETABLE]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.MOUSE} />
                      <span className="text-xs">{foodTypeLabels[FoodType.MOUSE]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.FROZEN_CHICK} />
                      <span className="text-xs">{foodTypeLabels[FoodType.FROZEN_CHICK]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.FRUIT_FLY} />
                      <span className="text-xs">{foodTypeLabels[FoodType.FRUIT_FLY]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeedingBadge foodType={FoodType.OTHER} />
                      <span className="text-xs">{foodTypeLabels[FoodType.OTHER]}</span>
                    </div>
                  </div>
                </div>

                {/* 슈퍼푸드 설명 */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-medium">슈퍼푸드 표시</p>
                  <div className="flex items-center gap-2">
                    <FeedingBadge foodType={FoodType.CRICKET} isSuperfood={true} />
                    <span className="text-xs text-muted-foreground">
                      별(★)이 표시된 먹이는 슈퍼푸드입니다
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    배지에 마우스를 올리면 상세 정보를 확인할 수 있습니다
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 필터 버튼 */}
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

                {/* 연도/월 선택 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">연도/월</label>
                  <div className="flex gap-2">
                    {/* 연도 선택 */}
                    <Select value={year.toString()} onValueChange={(val) => setYear(Number(val))}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}년
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 월 선택 */}
                    <Select value={month.toString()} onValueChange={(val) => setMonth(Number(val))}>
                      <SelectTrigger className="h-9 w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {m}월
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 고유개체ID/이름 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">ID/이름</label>
                  <Input
                    placeholder="ID 또는 이름 검색"
                    value={filters.uniqueId || ''}
                    onChange={(e) => updateFilter('uniqueId', e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* 먹이 종류 */}
                <div className="space-y-1.5 pb-2">
                  <label className="text-xs font-medium text-muted-foreground">먹이 종류</label>
                  <Select
                    value={filters.foodType || 'ALL'}
                    onValueChange={(value) =>
                      updateFilter('foodType', value === 'ALL' ? undefined : (value as FoodType))
                    }
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
              </div>

              {/* 하단 버튼 */}
              <div className="flex gap-2 pt-4 pb-3 border-t sticky bottom-0 bg-popover">
                <Button size="sm" variant="outline" onClick={handleReset} className="flex-1 gap-1">
                  <RotateCcw className="h-3 w-3" />
                  초기화
                </Button>
                <Button size="sm" onClick={handleApply} className="flex-2">
                  적용하기
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
