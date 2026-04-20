'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreHorizontal, Edit, Trash2, ExternalLink, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { Banner } from '@prisma/client'
import { deleteBanner } from '@/actions/banners/delete-banner'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BannerTableProps {
  banners: Banner[]
  onEdit: (banner: Banner) => void
  onReorder: (orderedIds: string[]) => void
  onDelete: () => void
}

interface SortableRowProps {
  banner: Banner
  onEdit: (banner: Banner) => void
  onDelete: (id: string) => void
  getStatusBadge: (banner: Banner) => React.ReactNode
}

function SortableRow({ banner, onEdit, onDelete, getStatusBadge }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[50px]">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div className="relative w-20 aspect-3/4 rounded overflow-hidden bg-gray-100">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <button
          onClick={() => onEdit(banner)}
          className="hover:underline text-left"
        >
          {banner.title}
        </button>
        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </TableCell>
      <TableCell>{getStatusBadge(banner)}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {banner.startDate || banner.endDate ? (
          <>
            {banner.startDate
              ? format(new Date(banner.startDate), 'yyyy-MM-dd HH:mm')
              : '시작일 없음'}
            {' ~ '}
            {banner.endDate
              ? format(new Date(banner.endDate), 'yyyy-MM-dd HH:mm')
              : '종료일 없음'}
          </>
        ) : (
          '상시 노출'
        )}
      </TableCell>
      <TableCell>
        {format(new Date(banner.createdAt), 'yyyy-MM-dd')}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">메뉴 열기</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(banner)}>
              <Edit className="mr-2 h-4 w-4" />
              수정하기
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onSelect={() => onDelete(banner.id)}
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-600 focus:text-red-600" />
              삭제하기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function BannerTable({ banners, onEdit, onReorder, onDelete }: BannerTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getStatusBadge = (banner: Banner) => {
    const now = new Date()
    const startDate = banner.startDate ? new Date(banner.startDate) : null
    const endDate = banner.endDate ? new Date(banner.endDate) : null

    if (!banner.isActive) {
      return <Badge variant="outline" className="text-gray-500">비활성</Badge>
    }

    if (startDate && now < startDate) {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">예약됨</Badge>
    }

    if (endDate && now > endDate) {
      return <Badge variant="outline" className="text-gray-500">종료됨</Badge>
    }

    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">노출중</Badge>
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id)
      const newIndex = banners.findIndex((b) => b.id === over.id)
      const newOrder = arrayMove(banners, oldIndex, newIndex)
      onReorder(newOrder.map((b) => b.id))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    const result = await deleteBanner(deleteId)
    if (result.success) {
      toast.success('배너가 삭제되었습니다.')
      onDelete()
    } else {
      toast.error(result.error || '삭제에 실패했습니다.')
    }
    setDeleteId(null)
  }

  return (
    <>
      <div className="rounded-md border bg-white overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[120px]">이미지</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>노출 기간</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-[100px]">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    등록된 배너가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={banners.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {banners.map((banner) => (
                    <SortableRow
                      key={banner.id}
                      banner={banner}
                      onEdit={onEdit}
                      onDelete={setDeleteId}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 삭제된 배너는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
