'use client'

import { type RefObject } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { AnimalListCard } from '@/components/mobile/animal-list/animal-list-card'
import { Loader2, Pencil, X } from 'lucide-react'
import type { AnimalListItem } from '@/services/animal-service'

interface AnimalCardGridProps {
  animals: AnimalListItem[]
  selectionMode: boolean
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onViewDetail: (animalId: string) => void
  onConfirmSelection: () => void
  onBulkEdit?: () => void
  onCancelSelection: () => void
  sentinelRef: RefObject<HTMLDivElement | null>
  loadingMore: boolean
}

export function AnimalCardGrid({
  animals,
  selectionMode,
  selectedIds,
  onSelectionChange,
  onViewDetail,
  onConfirmSelection,
  onBulkEdit,
  onCancelSelection,
  sentinelRef,
  loadingMore,
}: AnimalCardGridProps) {
  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? animals.map((a) => a.id) : [])
  }

  const handleCardClick = (animalId: string) => {
    if (selectionMode) {
      onSelectionChange(
        selectedIds.includes(animalId)
          ? selectedIds.filter((id) => id !== animalId)
          : [...selectedIds, animalId]
      )
    } else {
      onViewDetail(animalId)
    }
  }

  if (animals.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        개체가 없습니다.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 선택 모드 상단 바 */}
      {selectionMode && (
        <div className="shrink-0 flex items-center justify-between pb-3 border-b mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onCancelSelection}>
              <X className="h-4 w-4" />
            </Button>
            <Checkbox
              checked={animals.length > 0 && selectedIds.length === animals.length}
              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              aria-label="전체 선택"
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length > 0
                ? `${selectedIds.length}마리 선택됨`
                : '전체 선택'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onBulkEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBulkEdit}
                disabled={selectedIds.length === 0}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                일괄 편집
              </Button>
            )}
            <Button
              size="sm"
              onClick={onConfirmSelection}
              disabled={selectedIds.length === 0}
            >
              완료
            </Button>
          </div>
        </div>
      )}

      {/* 멀티 컬럼 리스트 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {animals.map((animal) => (
            <div key={animal.id}>
              <AnimalListCard
                animal={animal}
                selectionMode={selectionMode}
                selected={selectedIds.includes(animal.id)}
                onClick={handleCardClick}
              />
            </div>
          ))}
        </div>
        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          {loadingMore && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  )
}
