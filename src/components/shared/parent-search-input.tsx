import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface ParentSearchInputProps {
  searchId: string
  onSearchIdChange: (value: string) => void
  onSearch: () => void
  searching: boolean
  error: string
  disabled: boolean
  placeholder?: string
}

export function ParentSearchInput({
  searchId,
  onSearchIdChange,
  onSearch,
  searching,
  error,
  disabled,
  placeholder = '개체 ID로 검색',
}: ParentSearchInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={searchId}
          onChange={(e) => onSearchIdChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              onSearch()
            }
          }}
        />
        <Button
          type="button"
          onClick={onSearch}
          disabled={searching || disabled}
          size="icon"
          variant="outline"
        >
          {searching ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
