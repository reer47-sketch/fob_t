import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ParentInfo } from './parent-list'

interface ParentSearchResultsProps {
  results: ParentInfo[]
  onSelect: (parent: ParentInfo) => void
  currentParents: ParentInfo[]
}

export function ParentSearchResults({
  results,
  onSelect,
  currentParents,
}: ParentSearchResultsProps) {
  if (results.length === 0) {
    return null
  }

  const isAlreadyAdded = (uniqueId: string) => {
    return currentParents.some((p) => p.uniqueId === uniqueId)
  }

  return (
    <div className="absolute z-50 w-full mt-1">
      <Command className="border rounded-md shadow-lg bg-white">
        <CommandList className="max-h-[300px]">
          <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
          <CommandGroup>
            {results.map((parent) => {
              const alreadyAdded = isAlreadyAdded(parent.uniqueId)

              return (
                <CommandItem
                  key={parent.uniqueId}
                  onSelect={() => !alreadyAdded && onSelect(parent)}
                  disabled={alreadyAdded}
                  className={alreadyAdded ? 'opacity-60' : ''}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {parent.name || '이름 없음'}
                      {alreadyAdded && (
                        <span className="ml-2 text-xs text-red-500">
                          (이미 등록된 개체)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parent.uniqueId}
                    </p>
                    {(parent.speciesName || parent.morphName) && (
                      <p className="text-xs text-muted-foreground">
                        {[parent.speciesName, parent.morphName]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
