'use client'

import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Species = {
  id: string
  code: string
  name: string
  deletable: boolean
}

type SpeciesListProps = {
  species: Species[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onEdit: (species: Species) => void
  onDelete: (species: Species) => void
}

export function SpeciesList({ species, selectedId, onSelect, onAdd, onEdit, onDelete }: SpeciesListProps) {
  return (
    <div className="flex flex-col h-full border-r">
      {/* 헤더 */}
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">종 목록</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onAdd}
            className="h-7 w-7"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 종 목록 */}
      <div className="flex-1 overflow-y-auto">
        {species.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            등록된 종이 없습니다
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {species.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-accent",
                  selectedId === item.id && "bg-accent"
                )}
              >
                <button
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "w-full text-left",
                    item.deletable ? "pr-16" : "pr-8"
                  )}
                >
                  <div className={cn(
                    "font-medium",
                    selectedId === item.id && "font-medium"
                  )}>{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.code}</div>
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(item)
                    }}
                    className="h-6 w-6"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {item.deletable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item)
                      }}
                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
