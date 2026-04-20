'use client'

import Link from 'next/link'
import { ChevronRight, Bot } from 'lucide-react'
import { useState } from 'react'
import { AiAssistant } from '@/components/ai-assistant/ai-assistant'

export default function QuickActions() {
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <section className="px-4 pb-4">
      <div className="flex flex-col gap-2">
        <Link href="/animals/register">
          <div className="flex items-center gap-3 px-4 py-4 bg-white border border-emerald-200 rounded-xl active:bg-emerald-50 transition-colors">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-sm">개체 등록</h3>
              <p className="text-xs text-gray-500">새 개체 추가</p>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400" />
          </div>
        </Link>

        <Link href="/mobile/feeding">
          <div className="flex items-center gap-3 px-4 py-4 bg-white border border-orange-200 rounded-xl active:bg-orange-50 transition-colors">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-sm">개체 피딩</h3>
              <p className="text-xs text-gray-500">사료 급여</p>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-400" />
          </div>
        </Link>

        <button onClick={() => setAiOpen(true)} className="w-full text-left">
          <div className="flex items-center gap-3 px-4 py-4 bg-white border border-primary/20 rounded-xl active:bg-primary/5 transition-colors">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-sm">AI 음성 도우미</h3>
              <p className="text-xs text-gray-500">음성·채팅으로 기록 및 문의</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary/40" />
          </div>
        </button>
      </div>

      <AiAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </section>
  )
}
