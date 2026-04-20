'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AnimalListItem } from '@/services/animal-service'
import { Gender } from '@prisma/client'
import { Mars, Venus, CircleHelp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimalListCardProps {
  animal: AnimalListItem
  selectionMode?: boolean
  selected?: boolean
  onClick: (animalId: string) => void
  className?: string
}

const GenderIcon = ({ gender }: { gender: Gender }) => {
  switch (gender) {
    case 'MALE':
      return <Mars className="w-3.5 h-3.5 text-sky-500" />
    case 'FEMALE':
      return <Venus className="w-3.5 h-3.5 text-pink-500" />
    case 'UNKNOWN':
      return <CircleHelp className="w-3.5 h-3.5 text-muted-foreground" />
  }
}

export function AnimalListCard({ animal, selectionMode, selected, onClick, className }: AnimalListCardProps) {
  const species = animal.codes?.find((c) => c.code.category === 'SPECIES')?.code.name
  const morph = animal.codes?.find((c) => c.code.category === 'MORPH' && c.isPrimary)?.code.name
  const imageUrl = (animal as any).images?.[0]?.imageUrl

  return (
    <div
      className={cn(
        "flex gap-3 py-3 border-b last:border-b-0 cursor-pointer active:bg-muted/50 transition-colors",
        selectionMode && selected && "bg-primary/5",
        className
      )}
      onClick={() => onClick(animal.id)}
    >
      {/* 썸네일 */}
      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={animal.name || animal.uniqueId}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            사진 없음
          </div>
        )}
        {selectionMode && (
          <div className={cn(
            "absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            selected
              ? "bg-primary border-primary"
              : "bg-white/80 border-gray-300"
          )}>
            {selected && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[15px] font-semibold truncate">
          {animal.name || animal.uniqueId}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[species, morph].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <GenderIcon gender={animal.gender} />
          <span className="text-[11px] text-muted-foreground">
            {animal.acquisitionType === 'HATCHING' ? '해칭' : '입양'}
          </span>
          {animal.hatchDate && (
            <>
              <span className="text-[11px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">
                {format(new Date(animal.hatchDate), 'yyyy.MM.dd', { locale: ko })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
