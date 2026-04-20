'use client'

import { Feeding } from '@prisma/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { foodTypeLabels, foodTypeColors } from '@/lib/food-type-constants'

interface AnimalLatestFeedingInfoProps {
  latestFeeding: Feeding | null
}

const InfoRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex items-start py-1.5">
    <span className="text-sm text-muted-foreground min-w-[100px] shrink-0">
      {label}
    </span>
    {children}
  </div>
)

export function AnimalLatestFeedingInfo({ latestFeeding }: AnimalLatestFeedingInfoProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold min-w-0">피딩 정보</h3>
      </div>
      {latestFeeding ? (
        <div className="space-y-0.5">
          <InfoRow label="최근 급여일">
            <span className="text-sm font-medium">
              {format(new Date(latestFeeding.feedingDate), 'yyyy-MM-dd (E)', { locale: ko })}
            </span>
          </InfoRow>
          <InfoRow label="먹이 정보">
            <div className="flex gap-1.5 flex-wrap">
              <Badge className={`text-xs ${foodTypeColors[latestFeeding.foodType]}`}>
                {foodTypeLabels[latestFeeding.foodType] || latestFeeding.foodType}
              </Badge>
              {latestFeeding.superfood && (
                <Badge className="text-xs bg-white text-gray-700 hover:bg-white dark:bg-white dark:text-gray-700 border border-gray-300">
                  슈퍼푸드
                </Badge>
              )}
            </div>
          </InfoRow>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          피딩 기록이 없습니다.
        </div>
      )}
    </div>
  )
}
