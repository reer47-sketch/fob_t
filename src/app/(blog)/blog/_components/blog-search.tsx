'use client'

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState } from "react"

export function BlogSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState(searchParams.get('search') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }
    // Reset page to 1 when searching
    params.set('page', '1')
    
    startTransition(() => {
      router.push(`/blog?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="relative max-w-xl mx-auto group">
      {/* Lego Block Shadow Background */}
      <div className="absolute inset-0 bg-[#58BA2E] rounded-full translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
      
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 z-10" />
        <Input 
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="궁금한 사육 정보를 검색해 보세요" 
          className="pl-12 h-14 bg-white border-2 border-slate-900 rounded-full text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-slate-900 transition-all"
        />
      </div>
    </form>
  )
}
