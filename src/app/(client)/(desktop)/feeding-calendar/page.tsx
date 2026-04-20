'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { FeedingCalendarTable } from './_components/feeding-calendar-table'
import {
  FeedingCalendarFiltersComponent,
  FeedingCalendarFilters,
} from './_components/feeding-calendar-filters'
import { getFeedingCalendar } from '@/actions/feeding/get-feeding-calendar'
import { FeedingCalendarData } from '@/services/feeding-calendar-service'
import { AnimalDetailSheet } from '@/app/(client)/(desktop)/animals/_components/animal-detail-sheet'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeedingCalendarPage() {
  const searchParams = useSearchParams()
  const initialUniqueId = searchParams.get('uniqueId') ?? undefined
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<FeedingCalendarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [filters, setFilters] = useState<FeedingCalendarFilters>(() =>
    initialUniqueId ? { uniqueId: initialUniqueId } : {}
  )
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = useCallback(
    async (year: number, month: number, page: number, currentFilters: FeedingCalendarFilters) => {
      setLoading(true)
      try {
        const result = await getFeedingCalendar({
          year,
          month,
          page,
          pageSize: 20,
          ...currentFilters,
        })

        if (result.success) {
          setData(result.data)
        } else {
          console.error('Failed to fetch calendar:', result.error)
          setData(null)
        }
      } catch (error) {
        console.error('Error fetching calendar:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchData(selectedYear, selectedMonth, currentPage, filters)
  }, [selectedYear, selectedMonth, currentPage, filters, fetchData])

  const handleAnimalClick = (animalId: string) => {
    setSelectedAnimalId(animalId)
    setIsSheetOpen(true)
  }

  const handleSearch = (newFilters: FeedingCalendarFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleYearMonthChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-[calc(100vh-5rem)] overflow-hidden">
        {/* 필터 영역 */}
        <div className="shrink-0">
          <FeedingCalendarFiltersComponent
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSearch={handleSearch}
            onReset={handleReset}
            onYearMonthChange={handleYearMonthChange}
            initialFilters={initialUniqueId ? { uniqueId: initialUniqueId } : undefined}
          />
        </div>

        {/* 캘린더 테이블 영역 */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : data ? (
            <>
              <div className="flex-1 min-h-0">
                <FeedingCalendarTable data={data} onAnimalClick={handleAnimalClick} />
              </div>

              {/* 페이지네이션 */}
              {data.totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    전체 {data.totalCount}개 중 {(currentPage - 1) * 20 + 1}-
                    {Math.min(currentPage * 20, data.totalCount)}개
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === data.totalPages}
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">데이터를 불러올 수 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 개체 상세 Sheet */}
      <AnimalDetailSheet
        animalId={selectedAnimalId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  )
}
