'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { SalesAnimal } from '@/services/sales-service'

interface SalesCardGridProps {
  animals: SalesAnimal[]
  onCardClick: (animalId: string) => void
}

export function SalesCardGrid({ animals, onCardClick }: SalesCardGridProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {animals.map((animal) => (
        <Card
          key={animal.id}
          className="overflow-hidden py-0 cursor-pointer hover:shadow-md transition-shadow relative"
          onClick={() => onCardClick(animal.id)}
        >
          <CardContent className="p-0">
            {/* 이미지 영역 */}
            <div className="relative aspect-square bg-muted">
              {animal.imageUrl ? (
                <img
                  src={animal.imageUrl}
                  alt={animal.name || animal.uniqueId}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                  이미지 없음
                </div>
              )}

              {/* 양수양도 신고 여부 뱃지 (이미지 오버레이) */}
              <div className="absolute top-2 right-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${animal.isReported ? 'bg-green-500/50 text-white' : 'bg-red-500 text-white'}`}>
                  {animal.isReported ? '신고완료' : '신고 대기'}
                </span>
              </div>
            </div>

            {/* 정보 영역 */}
            <div className="p-2.5 space-y-1.5">
              {/* 상단: 가격 (가장 눈에 띄게) */}
              <div className="text-lg font-bold text-primary">
                {formatPrice(animal.price)}원
              </div>

              {/* 개체 코드 & 성별 */}
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-xs truncate" title={animal.uniqueId}>
                  {animal.uniqueId}
                </div>
                <div className={`text-base font-bold ${animal.gender === 'MALE' ? 'text-blue-600 dark:text-blue-400' : animal.gender === 'FEMALE' ? 'text-pink-600 dark:text-pink-400' : 'text-muted-foreground'}`}>
                  {animal.gender === 'MALE' ? '♂' : animal.gender === 'FEMALE' ? '♀' : '?'}
                </div>
              </div>

              {/* 모프 (최대 3개 + 나머지) */}
              {animal.morphs.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  {animal.morphs.slice(0, 3).map((morph) => (
                    <span
                      key={morph.id}
                      className="text-xs bg-blue-100/50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded"
                    >
                      {morph.name}
                    </span>
                  ))}
                  {animal.morphs.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{animal.morphs.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 형질 (최대 3개 + 나머지) */}
              {animal.traits.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  {animal.traits.slice(0, 3).map((trait) => (
                    <span
                      key={trait.id}
                      className="text-xs bg-purple-100/50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded"
                    >
                      {trait.name}
                    </span>
                  ))}
                  {animal.traits.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{animal.traits.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
