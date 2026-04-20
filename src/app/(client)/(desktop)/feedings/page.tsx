'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeedingSearchFilters, type SearchFilters } from './_components/feeding-search-filters'
import { FeedingListTable } from './_components/feeding-list-table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getFeedings } from '@/actions/feeding/get-feedings'
import { deleteFeeding } from '@/actions/feeding/delete-feeding'
import { toast } from 'sonner'
import type { FeedingListItem } from '@/services/feeding-list-service'
import { AnimalDetailSheet } from '@/app/(client)/(desktop)/animals/_components/animal-detail-sheet'

export default function FeedingsPage() {
  const [feedings, setFeedings] = useState<FeedingListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [isAnimalSheetOpen, setIsAnimalSheetOpen] = useState(false)

  const pageSize = 20

  const fetchFeedings = useCallback(async (currentPage: number, searchFilters: SearchFilters) => {
    setLoading(true)
    try {
      const result = await getFeedings({
        ...searchFilters,
        page: currentPage,
        pageSize,
      })

      if (result.success) {
        setFeedings(result.data.feedings)
        setTotalPages(result.data.totalPages)
        setTotal(result.data.total)
      } else {
        console.error('Failed to fetch feedings:', result.error)
        setFeedings([])
      }
    } catch (error) {
      console.error('Error fetching feedings:', error)
      setFeedings([])
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchFeedings(page, filters)
  }, [page, fetchFeedings])

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters)
    setPage(1)
    fetchFeedings(1, searchFilters)
  }

  const handleReset = () => {
    setFilters({})
    setPage(1)
    fetchFeedings(1, {})
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const handleDeleteClick = (feedingId: number) => {
    setDeleteTargetId(feedingId)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return

    setIsDeleting(true)
    try {
      const result = await deleteFeeding(deleteTargetId)
      if (result.success) {
        toast.success('피딩 기록이 삭제되었습니다')
        fetchFeedings(page, filters)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
      setDeleteTargetId(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTargetId(null)
  }

  const handleAnimalClick = (animalId: string) => {
    setSelectedAnimalId(animalId)
    setIsAnimalSheetOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-[calc(100vh-5rem)] overflow-hidden">
        {/* 검색 필터 영역 */}
        <FeedingSearchFilters onSearch={handleSearch} onReset={handleReset} />

        {/* 리스트 영역 */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0">
                <FeedingListTable
                  feedings={feedings}
                  onDelete={handleDeleteClick}
                  onAnimalClick={handleAnimalClick}
                />
              </div>

              {/* 페이지네이션 */}
              {totalPages > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    총 {total}건 | {page} / {totalPages} 페이지
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page === totalPages || loading}
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>피딩 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 피딩 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 개체 상세 시트 */}
      <AnimalDetailSheet
        animalId={selectedAnimalId}
        open={isAnimalSheetOpen}
        onOpenChange={setIsAnimalSheetOpen}
      />
    </>
  )
}
