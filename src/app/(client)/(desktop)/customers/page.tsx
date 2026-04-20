'use client'

import { useState, useEffect, useCallback } from 'react'
import { CustomerSearchFilters, type SearchFilters } from './_components/customer-search-filters'
import { CustomerListTable } from './_components/customer-list-table'
import { CustomerFormSheet } from './_components/customer-form-sheet'
import { AdoptionFormSheet } from './_components/adoption-form-sheet'
import { AdoptionHistorySheet } from './_components/adoption-history-sheet'
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getCustomers } from '@/actions/customers/get-customers'
import { deleteCustomer } from '@/actions/customers/delete-customer'
import type { CustomerListItem } from '@/services/customer-service'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null)
  const [adoptionSheetOpen, setAdoptionSheetOpen] = useState(false)
  const [adoptionCustomer, setAdoptionCustomer] = useState<CustomerListItem | null>(null)
  const [historySheetOpen, setHistorySheetOpen] = useState(false)
  const [historyCustomer, setHistoryCustomer] = useState<CustomerListItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const pageSize = 20

  const fetchCustomers = useCallback(async (currentPage: number, searchFilters: SearchFilters) => {
    setLoading(true)
    try {
      const result = await getCustomers({
        ...searchFilters,
        page: currentPage,
        pageSize,
      })

      if (result.success) {
        setCustomers(result.data.customers)
        setTotalPages(result.data.totalPages)
        setTotal(result.data.total)
      } else {
        console.error('Failed to fetch customers:', result.error)
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchCustomers(page, filters)
  }, [page, fetchCustomers])

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters)
    setPage(1)
    fetchCustomers(1, searchFilters)
  }

  const handleReset = () => {
    setFilters({})
    setPage(1)
    fetchCustomers(1, {})
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

  const handleEdit = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customer)
      setSheetOpen(true)
    }
  }

  const handleAdopt = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setAdoptionCustomer(customer)
      setAdoptionSheetOpen(true)
    }
  }

  const handleViewAdoptions = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setHistoryCustomer(customer)
      setHistorySheetOpen(true)
    }
  }

  const handleDelete = (customerId: string) => {
    setDeleteCustomerId(customerId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteCustomerId) return

    setDeleting(true)
    try {
      const result = await deleteCustomer(deleteCustomerId)
      if (result.success) {
        fetchCustomers(page, filters)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('고객 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteCustomerId(null)
    }
  }

  const handleRegister = () => {
    setSelectedCustomer(null)
    setSheetOpen(true)
  }

  const handleFormSuccess = () => {
    fetchCustomers(page, filters)
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-5rem)] overflow-hidden">
      {/* 검색 필터 + 등록 버튼 영역 */}
      <div className="shrink-0 flex items-center justify-between">
        <CustomerSearchFilters onSearch={handleSearch} onReset={handleReset} />
        <Button onClick={handleRegister} className="gap-2">
          <Plus className="h-4 w-4" />
          고객 등록
        </Button>
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0">
              <CustomerListTable
                customers={customers}
                onEdit={handleEdit}
                onAdopt={handleAdopt}
                onViewAdoptions={handleViewAdoptions}
                onDelete={handleDelete}
              />
            </div>

            {/* 페이지네이션 */}
            {totalPages > 0 && (
              <div className="shrink-0 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  총 {total}명 | {page} / {totalPages} 페이지
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

      <CustomerFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        customer={selectedCustomer}
        onSuccess={handleFormSuccess}
      />

      <AdoptionFormSheet
        open={adoptionSheetOpen}
        onOpenChange={setAdoptionSheetOpen}
        customer={adoptionCustomer}
        onSuccess={handleFormSuccess}
      />

      <AdoptionHistorySheet
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
        customer={historyCustomer}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고객을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              고객 정보는 삭제되지만 분양 기록은 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
