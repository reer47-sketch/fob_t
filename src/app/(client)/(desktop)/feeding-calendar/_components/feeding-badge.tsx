import { FoodType } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { foodTypeLabels, foodTypeColors } from '@/lib/food-type-constants'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FeedingBadgeProps {
  foodType: FoodType
  isSuperfood?: boolean
}

export function FeedingBadge({ foodType, isSuperfood = false }: FeedingBadgeProps) {
  // 먹이 이름의 첫 글자 추출
  const firstChar = foodTypeLabels[foodType].charAt(0)
  const label = foodTypeLabels[foodType]
  const tooltipText = isSuperfood ? `${label} (슈퍼푸드)` : label

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              'text-xs px-1.5 py-0.5 min-w-[32px] justify-center cursor-help',
              isSuperfood ? 'pt-0' : '',
              foodTypeColors[foodType]
            )}
          >
            <span className="flex flex-col items-center leading-tight">
              {isSuperfood && <span className="text-[9px] leading-none mb-[-2px]">★</span>}
              {firstChar}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
