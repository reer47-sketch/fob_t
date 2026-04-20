'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserSearchFilters, type SearchFilters } from './_components/user-search-filters'
import { UserListTable } from './_components/user-list-table'
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
import { getUsers } from '@/actions/admin/get-users'
import { updateUserStatus } from '@/actions/admin/update-user-status'
import { updateUserPlan } from '@/actions/admin/update-user-plan'
import type { UserListItem } from '@/services/user-service'
import type { UserPlan } from '@prisma/client'
import { toast } from 'sonner'

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'DELETED' | null>(null)
  const [updating, setUpdating] = useState(false)

  const pageSize = 20

  const fetchUsers = useCallback(async (currentPage: number, searchFilters: SearchFilters) => {
    setLoading(true)
    try {
      const result = await getUsers({
        ...searchFilters,
        page: currentPage,
        pageSize,
      })

      if (result.success && result.data) {
        setUsers(result.data.users)
        setTotalPages(result.data.totalPages)
        setTotal(result.data.total)
      } else {
        console.error('Failed to fetch users:', result.error)
        setUsers([])
        toast.error('유저 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      toast.error('유저 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchUsers(page, filters)
  }, [page, fetchUsers])

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters)
    setPage(1)
    fetchUsers(1, searchFilters)
  }

  const handleReset = () => {
    setFilters({})
    setPage(1)
    fetchUsers(1, {})
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

  const handlePlanChange = async (userId: string, plan: UserPlan) => {
    try {
      const result = await updateUserPlan(userId, plan)
      if (result.success) {
        toast.success('플랜이 변경되었습니다.')
        fetchUsers(page, filters)
      } else {
        toast.error(result.error || '플랜 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating user plan:', error)
      toast.error('플랜 변경에 실패했습니다.')
    }
  }

  const handleStatusChange = (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'DELETED') => {
    setSelectedUserId(userId)
    setSelectedStatus(status)
    setStatusDialogOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!selectedUserId || !selectedStatus) return

    setUpdating(true)
    try {
      const result = await updateUserStatus(selectedUserId, selectedStatus)
      if (result.success) {
        toast.success('유저 상태가 변경되었습니다.')
        fetchUsers(page, filters)
      } else {
        toast.error(result.error || '유저 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('유저 상태 변경에 실패했습니다.')
    } finally {
      setUpdating(false)
      setStatusDialogOpen(false)
      setSelectedUserId(null)
      setSelectedStatus(null)
    }
  }

  const getStatusChangeMessage = () => {
    if (!selectedStatus) return ''

    switch (selectedStatus) {
      case 'ACTIVE':
        return '이 유저를 활성화하시겠습니까?'
      case 'SUSPENDED':
        return '이 유저를 정지하시겠습니까?'
      case 'REJECTED':
        return '이 유저를 거부하시겠습니까?'
      case 'DELETED':
        return '이 유저를 삭제하시겠습니까? (복원 가능)'
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-5rem)] overflow-hidden">
      {/* 검색 필터 영역 */}
      <div className="shrink-0 flex items-center justify-between">
        <UserSearchFilters onSearch={handleSearch} onReset={handleReset} />
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
              <UserListTable
                users={users}
                onStatusChange={handleStatusChange}
                onPlanChange={handlePlanChange}
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

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>유저 상태 변경</AlertDialogTitle>
            <AlertDialogDescription>
              {getStatusChangeMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange} disabled={updating}>
              {updating ? '변경 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
