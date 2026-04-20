// TODO: 배너/글 컨텐츠 준비되면 아래 주석 해제
'use client'

import BannerCarousel from '@/components/home/BannerCarousel'
import NewsGrid from '@/components/home/NewsGrid'

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-sm mx-auto w-full">
        <BannerCarousel bannerWidth={100} />
      </div>
      <NewsGrid />
    </div>
  )
}