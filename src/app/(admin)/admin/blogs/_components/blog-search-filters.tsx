'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, RotateCcw, Search } from 'lucide-react'
import { DateRange } from 'react-day-picker'

interface SearchFilters {
  search?: string
  from?: string
  to?: string
  status?: string
}

export function BlogSearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<SearchFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({})
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // URL 파라미터에서 초기값 로드
  useEffect(() => {
    const search = searchParams.get('search') || undefined
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const status = searchParams.get('status') || undefined

    const initialFilters = { search, from, to, status }
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)

    if (from || to) {
      setDateRange({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined
      })
    } else {
      setDateRange(undefined)
    }
  }, [searchParams])

  const handleApply = () => {
    setAppliedFilters(filters)

    const params = new URLSearchParams(searchParams)

    if (filters.search) {
      params.set('search', filters.search)
    } else {
      params.delete('search')
    }

    if (filters.from) {
      params.set('from', filters.from)
    } else {
      params.delete('from')
    }

    if (filters.to) {
      params.set('to', filters.to)
    } else {
      params.delete('to')
    }

    if (filters.status) {
      params.set('status', filters.status)
    } else {
      params.delete('status')
    }

    params.set('page', '1')
    router.push(`/admin/blogs?${params.toString()}`)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters({})
    setAppliedFilters({})
    setDateRange(undefined)

    const params = new URLSearchParams(searchParams)
    params.delete('search')
    params.delete('from')
    params.delete('to')
    params.delete('status')
    params.set('page', '1')
    router.push(`/admin/blogs?${params.toString()}`)
    setIsOpen(false)
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    setFilters(prev => ({
      ...prev,
      from: range?.from ? range.from.toISOString() : undefined,
      to: range?.to ? range.to.toISOString() : undefined
    }))
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PUBLISHED': return '발행됨'
      case 'SCHEDULED': return '예약됨'
      case 'DRAFT': return '임시저장'
      default: return '전체'
    }
  }

  const getFilterSummary = () => {
    const summary: string[] = []

    if (appliedFilters.status) {
      summary.push(`상태: ${getStatusLabel(appliedFilters.status)}`)
    }

    if (appliedFilters.search) {
      summary.push(`검색: ${appliedFilters.search}`)
    }

    if (appliedFilters.from || appliedFilters.to) {
      const from = appliedFilters.from ? format(new Date(appliedFilters.from), 'yy.MM.dd') : '시작'
      const to = appliedFilters.to ? format(new Date(appliedFilters.to), 'yy.MM.dd') : '종료'
      summary.push(`날짜: ${from} ~ ${to}`)
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
        <PopoverContent className="w-[320px] pb-0" align="end">
          <div className="space-y-4 pb-2">
            <h4 className="font-semibold text-sm">검색 조건</h4>

            {/* 상태 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                상태
              </label>
              <Select
                value={filters.status || 'ALL'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'ALL' ? undefined : value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="PUBLISHED">발행됨</SelectItem>
                  <SelectItem value="SCHEDULED">예약됨</SelectItem>
                  <SelectItem value="DRAFT">임시저장</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 검색어 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                검색어
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제목, 내용 검색..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="h-9 pl-8"
                />
              </div>
            </div>

            {/* 날짜 범위 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                등록일
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-9"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'yy.MM.dd')} - {format(dateRange.to, 'yy.MM.dd')}
                        </>
                      ) : (
                        format(dateRange.from, 'yy.MM.dd')
                      )
                    ) : (
                      <span className="text-muted-foreground">날짜 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
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
              className="flex-1"
            >
              적용하기
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
