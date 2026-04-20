'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, RotateCcw } from 'lucide-react'

export interface SearchFilters {
  name?: string
}

interface CustomerSearchFiltersProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
}

export function CustomerSearchFilters({ onSearch, onReset }: CustomerSearchFiltersProps) {
  const [name, setName] = useState('')

  const handleSearch = () => {
    onSearch({ name: name || undefined })
  }

  const handleReset = () => {
    setName('')
    onReset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="고객 이름 검색"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-[200px]"
      />
      <Button variant="outline" size="icon" onClick={handleSearch}>
        <Search className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleReset}>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  )
}
