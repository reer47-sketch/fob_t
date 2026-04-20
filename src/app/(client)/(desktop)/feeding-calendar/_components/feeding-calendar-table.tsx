import { FeedingCalendarData } from '@/services/feeding-calendar-service'
import { FeedingBadge } from './feeding-badge'
import { FoodType } from '@prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface FeedingCalendarTableProps {
  data: FeedingCalendarData
  onAnimalClick?: (animalId: string) => void
}

export function FeedingCalendarTable({ data, onAnimalClick }: FeedingCalendarTableProps) {
  const { animals, feedingsByAnimalAndDay, superfoodsByAnimalAndDay, daysInMonth } = data

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary sticky top-0 z-20 hover:bg-secondary">
              {/* 고정 컬럼 - 개체명 */}
              <TableHead className="sticky left-0 z-30 bg-secondary border-r min-w-[150px] px-4 py-2 text-left">
                개체명/고유개체ID
              </TableHead>
              {/* 날짜 컬럼 (1~말일) */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <TableHead key={day} className="border-r min-w-[50px] px-2 py-2 text-center">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {animals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={daysInMonth + 1} className="text-center py-8">
                  등록된 개체가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              animals.map((animal) => {
                const animalFeedings = feedingsByAnimalAndDay[animal.id] || {}
                const animalSuperfoods = superfoodsByAnimalAndDay[animal.id] || {}

                return (
                  <TableRow key={animal.id}>
                    {/* 개체명 (sticky) */}
                    <TableCell className="sticky left-0 z-10 bg-background border-r px-4 py-2">
                      <button
                        onClick={() => onAnimalClick?.(animal.id)}
                        className="text-left hover:underline text-sm"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span>{animal.name || '이름 없음'}</span>
                          <span className="text-xs text-muted-foreground">{animal.uniqueId}</span>
                        </div>
                      </button>
                    </TableCell>
                    {/* 날짜별 피딩 */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const foodType = animalFeedings[day] as FoodType | undefined
                      const isSuperfood = animalSuperfoods[day] || false

                      return (
                        <TableCell key={day} className="border-r px-2 py-2 text-center">
                          {foodType ? (
                            <FeedingBadge foodType={foodType} isSuperfood={isSuperfood} />
                          ) : null}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
