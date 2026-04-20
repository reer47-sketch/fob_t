'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface AdminBlogPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
}

export function AdminBlogPagination({ currentPage, totalPages, totalCount }: AdminBlogPaginationProps) {
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    return `/admin/blogs?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        총 {totalCount}개 | {currentPage} / {totalPages} 페이지
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage <= 1}
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            이전
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage >= totalPages}
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          <Link href={createPageUrl(currentPage + 1)}>
            다음
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
