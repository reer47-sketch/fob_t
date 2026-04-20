'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, RotateCcw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface SearchFilters {
  email?: string
  name?: string
  role?: 'ADMIN' | 'BREEDER'
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DELETED'
}

interface UserSearchFiltersProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
}

export function UserSearchFilters({ onSearch, onReset }: UserSearchFiltersProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')

  const handleSearch = () => {
    const filters: SearchFilters = {}

    if (email.trim()) {
      filters.email = email.trim()
    }

    if (name.trim()) {
      filters.name = name.trim()
    }

    if (role !== 'all') {
      filters.role = role as 'ADMIN' | 'BREEDER'
    }

    if (status !== 'all') {
      filters.status = status as 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DELETED'
    }

    onSearch(filters)
  }

  const handleReset = () => {
    setEmail('')
    setName('')
    setRole('all')
    setStatus('all')
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
        type="text"
        placeholder="이메일 검색"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-[200px]"
      />

      <Input
        type="text"
        placeholder="이름 검색"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-[200px]"
      />

      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="역할" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 역할</SelectItem>
          <SelectItem value="ADMIN">관리자</SelectItem>
          <SelectItem value="BREEDER">브리더</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="PENDING">승인대기</SelectItem>
          <SelectItem value="ACTIVE">활성</SelectItem>
          <SelectItem value="REJECTED">거부</SelectItem>
          <SelectItem value="SUSPENDED">정지</SelectItem>
          <SelectItem value="DELETED">삭제</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleSearch} size="sm" className="gap-2">
        <Search className="h-4 w-4" />
        검색
      </Button>

      <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
        <RotateCcw className="h-4 w-4" />
        초기화
      </Button>
    </div>
  )
}
