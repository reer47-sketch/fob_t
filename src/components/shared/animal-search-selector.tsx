'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { searchAllAnimals } from '@/actions/animals/search-all-animals'

export interface AnimalInfo {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  imageUrl?: string
  speciesName?: string
  morphName?: string
}

interface AnimalSearchSelectorProps {
  selectedAnimal: AnimalInfo | null
  onSelect: (animal: AnimalInfo) => void
  onClear: () => void
  excludeAnimalId?: string
  placeholder?: string
  className?: string
  gender?: 'MALE' | 'FEMALE'
}

export function AnimalSearchSelector({
  selectedAnimal,
  onSelect,
  onClear,
  excludeAnimalId,
  placeholder = '개체 ID 또는 이름으로 검색',
  className,
  gender,
}: AnimalSearchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState<AnimalInfo[]>([])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('검색어를 입력해주세요')
      return
    }

    setSearching(true)
    setError('')
    setSearchResults([])

    try {
      const result = await searchAllAnimals(searchTerm.trim(), excludeAnimalId, gender)

      if (!result.success) {
        const errorMessage =
          'error' in result ? result.error : '개체를 찾을 수 없습니다'
        setError(errorMessage)
        return
      }

      if ('data' in result) {
        setSearchResults(result.data)
      }
    } catch (error) {
      console.error('Animal search error:', error)
      setError('개체 검색 중 오류가 발생했습니다')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectAnimal = (animal: AnimalInfo) => {
    onSelect(animal)
    setSearchTerm('')
    setSearchResults([])
    setError('')
  }

  const handleClear = () => {
    onClear()
    setSearchTerm('')
    setSearchResults([])
    setError('')
  }

  // 선택된 개체가 있으면 선택된 개체 표시
  if (selectedAnimal) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {selectedAnimal.name || '이름 없음'}
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedAnimal.uniqueId}
            </div>
          </div>

          {/* 삭제 버튼 */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // 선택된 개체가 없으면 검색 UI 표시
  return (
    <div className={className}>
      <div className="space-y-2">
        {/* 검색 입력 */}
        <div className="relative">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setError('')
              setSearchResults([])
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            className="pr-9"
            disabled={searching}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !searchTerm.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-xs text-destructive">{error}</div>
        )}

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
            {searchResults.map((animal) => (
              <button
                key={animal.id}
                type="button"
                onClick={() => handleSelectAnimal(animal)}
                className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
              >
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {animal.name || '이름 없음'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {animal.uniqueId}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
