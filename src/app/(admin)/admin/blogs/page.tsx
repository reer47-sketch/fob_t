import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { BlogListTable } from "./_components/blog-list-table"
import { getAdminBlogs } from "@/actions/blogs/get-admin-blogs"
import { BlogSearchFilters } from "./_components/blog-search-filters"
import { AdminBlogPagination } from "./_components/admin-blog-pagination"

interface BlogsPageProps {
  searchParams: Promise<{
    page?: string
    status?: string
    search?: string
    from?: string
    to?: string
  }>
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = params.status as any || undefined
  const search = params.search || undefined
  const from = params.from || undefined
  const to = params.to || undefined

  const blogsResult = await getAdminBlogs({ page, pageSize: 10, status, search, from, to })

  const blogs = blogsResult.success ? blogsResult.data.blogs : []
  const totalPages = blogsResult.success ? blogsResult.data.totalPages : 1
  const total = blogsResult.success ? blogsResult.data.total : 0

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-5rem)] overflow-hidden">
      {/* 필터 및 새 글 작성 버튼 */}
      <div className="shrink-0 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <BlogSearchFilters />
        <Link href="/admin/blogs/new">
          <Button className="gap-2 bg-[#58BA2E] hover:bg-[#58BA2E]/90">
            <PlusCircle className="h-4 w-4" />
            새 글 작성
          </Button>
        </Link>
      </div>

      {/* 테이블 영역 */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex-1 min-h-0">
          <BlogListTable initialData={blogs} />
        </div>

        {totalPages > 0 && (
          <div className="shrink-0">
            <AdminBlogPagination currentPage={page} totalPages={totalPages} totalCount={total} />
          </div>
        )}
      </div>
    </div>
  )
}
