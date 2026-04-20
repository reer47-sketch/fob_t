"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { BlogListItem } from "@/services/blog-service"
import { deleteBlog } from "@/actions/blogs/delete-blog"
import { toast } from "sonner"
import { useState } from "react"

interface BlogListTableProps {
  initialData: BlogListItem[]
}

export function BlogListTable({ initialData }: BlogListTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getStatusBadge = (status: BlogListItem['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">발행됨</Badge>
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">예약됨</Badge>
      case 'DRAFT':
        return <Badge variant="outline" className="text-gray-500">임시저장</Badge>
    }
  }

  const getScopeBadge = (scope: BlogListItem['targetScope']) => {
    if (scope === 'MEMBER_ONLY') {
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">회원전용</Badge>
    }
    return <Badge variant="outline" className="text-gray-500 bg-gray-50 border-gray-200">전체공개</Badge>
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    const result = await deleteBlog(deleteId)
    if (result.success) {
        toast.success("블로그 글이 삭제되었습니다.")
    } else {
        toast.error(result.error || "삭제에 실패했습니다.")
    }
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex flex-col border rounded-lg bg-white overflow-hidden h-full">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="text-left">제목</TableHead>
              <TableHead className="text-left">상태</TableHead>
              <TableHead className="text-left">공개 범위</TableHead>
              <TableHead className="text-left">첨부파일</TableHead>
              <TableHead className="text-left">조회수</TableHead>
              <TableHead className="text-left">게시일</TableHead>
              <TableHead className="w-[100px] text-left">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  게시글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium text-left">
                    <Link href={`/admin/blogs/edit/${blog.id}`} className="hover:underline">
                        {blog.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-left">{getStatusBadge(blog.status)}</TableCell>
                  <TableCell className="text-left">{getScopeBadge(blog.targetScope)}</TableCell>
                  <TableCell className="text-left">
                    {blog.attachmentCount > 0 ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none">
                            {blog.attachmentCount}개
                        </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-left">{blog.views.toLocaleString()}</TableCell>
                  <TableCell className="text-left">
                    {blog.publishedAt && blog.status !== 'DRAFT' ? format(new Date(blog.publishedAt), "yyyy-MM-dd") : "-"}
                  </TableCell>
                  <TableCell className="text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">메뉴 열기</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/blog/${blog.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            미리보기
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/blogs/edit/${blog.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            수정하기
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                          onSelect={() => setDeleteId(blog.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제하기
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 삭제된 게시글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}