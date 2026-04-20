'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getPublicBanners } from '@/actions/banners/get-public-banners'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
}

interface BannerCarouselProps {
  bannerWidth?: number // 기본값 80%
}

export default function BannerCarousel({ bannerWidth = 80 }: BannerCarouselProps) {
  const sideOffset = (100 - bannerWidth) / 2
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchBanners = async () => {
      const result = await getPublicBanners()
      if (result.success && result.data.length > 0) {
        setBanners(result.data)
      }
      setIsLoading(false)
    }
    fetchBanners()
  }, [])

  const extendedBanners = banners.length > 0
    ? [banners[banners.length - 1], ...banners, banners[0]]
    : []

  const realIndex = currentIndex === 0
    ? banners.length - 1
    : currentIndex === extendedBanners.length - 1
    ? 0
    : currentIndex - 1

  const startAutoSlide = () => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => prev + 1)
    }, 5000)
  }

  useEffect(() => {
    startAutoSlide()
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    }
  }, [])

  useEffect(() => {
    if (banners.length === 0) return
    if (currentIndex === 0) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(banners.length)
      }, 500)
    } else if (currentIndex === extendedBanners.length - 1) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(1)
      }, 500)
    }
  }, [currentIndex, extendedBanners.length, banners.length])

  useEffect(() => {
    if (!isTransitioning) {
      requestAnimationFrame(() => {
        setIsTransitioning(true)
      })
    }
  }, [isTransitioning])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (diff > threshold) {
      setCurrentIndex((prev) => prev + 1)
    } else if (diff < -threshold) {
      setCurrentIndex((prev) => prev - 1)
    }
    startAutoSlide()
  }

  const handleIndicatorClick = (index: number) => {
    setCurrentIndex(index + 1)
    startAutoSlide()
  }

  if (isLoading) {
    return (
      <section className="relative">
        <div className="flex justify-center px-4">
          <div className="w-full max-w-[80%] aspect-3/4 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </section>
    )
  }

  if (banners.length === 0) {
    return null
  }

  const renderBannerContent = (banner: Banner, idx: number) => {
    const content = (
      <div
        className={`relative w-full aspect-3/4 bg-gray-200 rounded-2xl overflow-hidden ${
          isTransitioning ? 'transition-all duration-500' : ''
        } ${idx === currentIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-60'}`}
      >
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    )

    if (banner.linkUrl) {
      return (
        <Link href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </Link>
      )
    }

    return content
  }

  return (
    <section className="relative">
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{
            transform: `translateX(calc(-${currentIndex * bannerWidth}% + ${sideOffset}%))`,
          }}
        >
          {extendedBanners.map((banner, idx) => (
            <div
              key={`${banner.id}-${idx}`}
              className="shrink-0 px-1.5 transition-all duration-500"
              style={{ width: `${bannerWidth}%` }}
            >
              {renderBannerContent(banner, idx)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-3">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleIndicatorClick(idx)}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === realIndex ? 'bg-gray-800' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
