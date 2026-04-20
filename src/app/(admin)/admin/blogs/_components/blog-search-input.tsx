'use client'

import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"

export function BlogSearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [term, setTerm] = useState(defaultValue || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/admin/blogs?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full sm:w-64">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="검색..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="pl-8"
      />
    </form>
  )
}
