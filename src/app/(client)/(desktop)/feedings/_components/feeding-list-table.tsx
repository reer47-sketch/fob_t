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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import type { FeedingListItem } from '@/services/feeding-list-service'
import { foodTypeLabels, foodTypeColors } from '@/lib/food-type-constants'

interface FeedingListTableProps {
  feedings: FeedingListItem[]
  onDelete?: (feedingId: number) => void
  onAnimalClick?: (animalId: string) => void
}

export function FeedingListTable({ feedings, onDelete, onAnimalClick }: FeedingListTableProps) {
  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'yyyy-MM-dd', { locale: ko })
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden h-full">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            <TableRow>
              <TableHead className="w-[100px]">피딩 날짜</TableHead>
              <TableHead className="w-[140px]">고유개체ID</TableHead>
              <TableHead className="w-[120px]">개체 이름</TableHead>
              <TableHead className="w-[80px]">먹이 종류</TableHead>
              <TableHead className="w-[80px]">슈퍼푸드</TableHead>
              <TableHead className="w-[80px]">급여량</TableHead>
              <TableHead>메모</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-[400px] text-center text-muted-foreground">
                  피딩 기록이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              feedings.map((feeding) => (
                <TableRow key={feeding.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(feeding.feedingDate)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => onAnimalClick?.(feeding.animal.id)}
                      className="font-mono text-sm whitespace-nowrap hover:underline cursor-pointer"
                    >
                      {feeding.animal.uniqueId}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium truncate block max-w-[120px]">
                      {feeding.animal.name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={foodTypeColors[feeding.foodType]}>
                      {foodTypeLabels[feeding.foodType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {feeding.superfood ? (
                      <Badge className="text-xs bg-white text-gray-700 hover:bg-white border border-gray-300">
                        슈퍼푸드
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="truncate block max-w-[80px]">
                      {feeding.quantity || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {feeding.memo ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="line-clamp-2 cursor-default">
                            {feeding.memo}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] whitespace-pre-wrap">
                          {feeding.memo}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete?.(feeding.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
