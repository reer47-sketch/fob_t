// TODO: 배너/글 컨텐츠 준비되면 아래 주석 해제
'use client'

import BannerCarousel from '@/components/home/BannerCarousel'
import NewsList from '@/components/home/NewsList'
import QuickActions from '@/components/home/QuickActions'

export default function MobileHome() {
  return (
    <div className="h-full flex flex-col gap-6 py-4 overflow-y-auto">
      <BannerCarousel />
      <NewsList />
      <QuickActions />
    </div>
  )
}