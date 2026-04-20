'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getSalesAction } from '@/actions/sales/get-sales'
import type { SalesAnimal } from '@/services/sales-service'
import { AnimalDetailSheet } from '@/app/(client)/(desktop)/animals/_components/animal-detail-sheet'
import { SalesSearchFilters, type SearchFilters } from './_components/sales-search-filters'
import { SalesCardGrid } from './_components/sales-card-grid'

export default function SalesPage() {
  const searchParams = useSearchParams()
  const initialUniqueId = searchParams.get('uniqueId') ?? undefined
  const [animals, setAnimals] = useState<SalesAnimal[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(() =>
    initialUniqueId ? { uniqueId: initialUniqueId } : {}
  )
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const pageSize = 15

  // 판매이력 조회
  const fetchSales = useCallback(async (currentPage: number, searchFilters: SearchFilters) => {
    setLoading(true)
    try {
      const result = await getSalesAction({
        ...searchFilters,
        page: currentPage,
        pageSize,
      })

      if (result.success && result.data) {
        setAnimals(result.data.animals)
        setTotalPages(result.data.totalPages)
        setTotal(result.data.total)
      } else if (!result.success) {
        console.error('Failed to fetch sales:', result.error)
        setAnimals([])
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      setAnimals([])
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchSales(page, filters)
  }, [page, filters, fetchSales])

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters)
    setPage(1)
  }

  const handleReset = () => {
    setFilters({})
    setPage(1)
  }

  const handleCardClick = (animalId: string) => {
    setSelectedAnimalId(animalId)
    setIsSheetOpen(true)
  }

  const handleSheetClose = () => {
    setIsSheetOpen(false)
    setSelectedAnimalId(null)
  }

  const handleRefresh = () => {
    fetchSales(page, filters)
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-5rem)] overflow-hidden">
      {/* 검색 필터 영역 */}
      <div className="shrink-0">
        <SalesSearchFilters
          onSearch={handleSearch}
          onReset={handleReset}
          onRefresh={handleRefresh}
          animals={animals}
          loading={loading}
          total={total}
          filters={filters}
          initialFilters={initialUniqueId ? { uniqueId: initialUniqueId } : undefined}
        />
      </div>

      {/* 카드 리스트 영역 */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full border rounded-lg">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : animals.length === 0 ? (
          <div className="flex items-center justify-center h-full border rounded-lg">
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        ) : (
          <SalesCardGrid animals={animals} onCardClick={handleCardClick} />
        )}
      </div>

      {/* 개체 상세 시트 */}
      <AnimalDetailSheet
        animalId={selectedAnimalId}
        open={isSheetOpen}
        onOpenChange={handleSheetClose}
        onDeleted={() => {
          handleSheetClose()
          fetchSales(page, filters)
        }}
      />

      {/* 페이지네이션 */}
      {totalPages > 0 && (
        <div className="shrink-0 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {total}건 | {page} / {totalPages} 페이지
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
