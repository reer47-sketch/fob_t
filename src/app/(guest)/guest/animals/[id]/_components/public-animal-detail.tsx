'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getPublicAnimalDetail } from '@/actions/animals/get-public-animal-detail'
import type { AnimalDetailData } from '@/services/animal-service'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Dna,
  Heart,
  TreePine,
  Store,
} from 'lucide-react'

interface PublicAnimalDetailProps {
  animalId: string
}

export function PublicAnimalDetail({ animalId }: PublicAnimalDetailProps) {
  const [animal, setAnimal] = useState<AnimalDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [healthOpen, setHealthOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAnimal = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getPublicAnimalDetail(animalId)
        if (result.success && 'data' in result) {
          setAnimal(result.data)
        } else {
          setError(result.error || '개체를 찾을 수 없습니다.')
        }
      } catch (err) {
        console.error('Error fetching animal:', err)
        setError('개체 조회 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnimal()
  }, [animalId])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const index = Math.round(container.scrollLeft / container.offsetWidth)
    setCurrentImageIndex(index)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[15px] text-muted-foreground">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !animal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 bg-gray-50">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <X className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-destructive text-center font-medium">{error || '개체를 찾을 수 없습니다.'}</p>
        <p className="text-[15px] text-muted-foreground text-center">
          이 개체는 공개되지 않았거나 존재하지 않습니다.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-[15px] font-medium active:opacity-80"
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    )
  }

  const speciesCode = animal.codes.find((c) => c.code.category === 'SPECIES')
  const morphCodes = animal.codes.filter((c) => c.code.category === 'MORPH')
  const traitCodes = animal.codes.filter((c) => c.code.category === 'TRAIT')
  const colorCodes = animal.codes.filter((c) => c.code.category === 'COLOR')

  const sortedImages = [...animal.images].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const fathers = animal.parents.filter((p) => p.parentType === 'FATHER')
  const mothers = animal.parents.filter((p) => p.parentType === 'MOTHER')

  const genderLabel =
    animal.gender === 'MALE' ? '♂ 수컷' : animal.gender === 'FEMALE' ? '♀ 암컷' : '미구분'
  const hasAppearanceInfo =
    traitCodes.length > 0 ||
    colorCodes.length > 0 ||
    animal.detail?.currentSize ||
    animal.detail?.tailStatus ||
    animal.detail?.patternType ||
    animal.detail?.distinctiveMarks ||
    animal.detail?.quality

  const hasHealthInfo = animal.detail?.healthStatus || animal.detail?.specialNeeds
  const hasHabitatInfo =
    animal.detail?.cageInfo || animal.detail?.flooringInfo || animal.detail?.habitatNotes
  const hasParentInfo = animal.parentPublic && animal.parents.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 이미지 캐러셀 */}
      {sortedImages.length > 0 && (
        <div className="bg-white">
          <div className="relative">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {sortedImages.map((image, index) => (
                <div
                  key={image.id}
                  className="flex-none w-full snap-center"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <div className="relative aspect-square bg-gray-100 cursor-pointer">
                    <img
                      src={image.imageUrl}
                      alt={animal.name || '개체 이미지'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
            {sortedImages.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[13px] px-2.5 py-0.5 rounded-full">
                {currentImageIndex + 1} / {sortedImages.length}
              </div>
            )}
          </div>
          {sortedImages.length > 1 && (
            <div className="flex justify-center gap-1.5 py-3">
              {sortedImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentImageIndex ? 'w-4 bg-primary' : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 개체 핵심 정보 - 이미지 바로 아래 연결 */}
      <div className="bg-white px-5 pt-5 pb-6">
        {speciesCode && (
          <p className="text-[14px] text-muted-foreground mb-1">
            {speciesCode.code.name}
          </p>
        )}
        <h1 className="text-[20px] font-bold leading-tight">
          {animal.name || animal.uniqueId}
        </h1>
        {animal.name && (
          <p className="text-[13px] text-muted-foreground mt-1">ID: {animal.uniqueId}</p>
        )}

        {/* 모프 + 등급 뱃지 */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {morphCodes.map((code) => (
            <Badge key={code.code.id} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[13px] font-semibold px-2.5 py-0.5">
              {code.code.name}
            </Badge>
          ))}
          {animal.detail?.quality && (
            <Badge variant="outline" className={`text-[13px] px-2.5 py-0.5 font-semibold ${getQualityColor(animal.detail.quality)}`}>
              {animal.detail.quality}등급
            </Badge>
          )}
        </div>

        {/* 스펙 텍스트 */}
        <p className="flex items-center gap-1.5 mt-3 text-[14px] text-muted-foreground">
          <span className={animal.gender === 'MALE' ? 'text-blue-500' : animal.gender === 'FEMALE' ? 'text-pink-500' : ''}>
            {genderLabel}
          </span>
          {animal.acquisitionType && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span>{animal.acquisitionType === 'ADOPTION' ? '입양' : '해칭'}</span>
            </>
          )}
          {animal.hatchDate && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span>{new Date(animal.hatchDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </>
          )}
        </p>
      </div>

      <div className="space-y-2 mt-2">
        {/* 샵 정보 */}
        {animal.shop && (
          <section className="bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <Avatar className="w-11 h-11">
                {animal.shop.profileImage ? (
                  <AvatarImage src={animal.shop.profileImage} alt={animal.shop.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Store className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-muted-foreground">브리더</p>
                <p className="font-semibold text-[15px] truncate">{animal.shop.name}</p>
              </div>
            </div>
          </section>
        )}

        {/* 외관 정보 */}
        {hasAppearanceInfo && (
          <section className="bg-white px-5 py-5">
            <button
              onClick={() => setAppearanceOpen(!appearanceOpen)}
              className="flex items-center justify-between w-full"
            >
              <SectionTitle icon={<Dna className="w-4 h-4" />} title="외관 정보" />
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${appearanceOpen ? 'rotate-180' : ''}`} />
            </button>
            {appearanceOpen && (
              <div className="space-y-3.5 mt-4">
                {traitCodes.length > 0 && (
                  <InfoRow label="형질">
                    <div className="flex flex-wrap gap-1.5">
                      {traitCodes.map((code) => (
                        <Badge key={code.code.id} variant="secondary" className="text-[13px] border-0">
                          {code.code.name}
                        </Badge>
                      ))}
                    </div>
                  </InfoRow>
                )}
                {colorCodes.length > 0 && (
                  <InfoRow label="색감">
                    <div className="flex flex-wrap gap-1.5">
                      {colorCodes.map((code) => (
                        <Badge key={code.code.id} variant="outline" className="text-[13px]">
                          {code.code.name}
                        </Badge>
                      ))}
                    </div>
                  </InfoRow>
                )}
                {animal.detail?.currentSize && (
                  <InfoRow label="현재 크기">{animal.detail.currentSize}</InfoRow>
                )}
                {animal.detail?.tailStatus && (
                  <InfoRow label="꼬리 상태">{animal.detail.tailStatus}</InfoRow>
                )}
                {animal.detail?.patternType && (
                  <InfoRow label="무늬 유형">{animal.detail.patternType}</InfoRow>
                )}
                {animal.detail?.distinctiveMarks && (
                  <InfoRow label="특이 표식">{animal.detail.distinctiveMarks}</InfoRow>
                )}
              </div>
            )}
          </section>
        )}

        {/* 건강 정보 */}
        {hasHealthInfo && (
          <section className="bg-white px-5 py-5">
            <button
              onClick={() => setHealthOpen(!healthOpen)}
              className="flex items-center justify-between w-full"
            >
              <SectionTitle icon={<Heart className="w-4 h-4" />} title="건강 정보" />
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${healthOpen ? 'rotate-180' : ''}`} />
            </button>
            {healthOpen && (
              <div className="space-y-3.5 mt-4">
                {animal.detail?.healthStatus && (
                  <InfoRow label="건강 상태">
                    <p className="whitespace-pre-wrap">{animal.detail.healthStatus}</p>
                  </InfoRow>
                )}
                {animal.detail?.specialNeeds && (
                  <InfoRow label="특이사항">
                    <p className="whitespace-pre-wrap">{animal.detail.specialNeeds}</p>
                  </InfoRow>
                )}
              </div>
            )}
          </section>
        )}

        {/* 부모 정보 */}
        {hasParentInfo && (
          <section className="bg-white px-5 py-5">
            <SectionTitle icon={<Dna className="w-4 h-4" />} title="부모 정보" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {fathers.map((rel) => (
                <ParentCard
                  key={rel.parent.id}
                  label="부(父)"
                  parent={rel.parent}
                />
              ))}
              {mothers.map((rel) => (
                <ParentCard
                  key={rel.parent.id}
                  label="모(母)"
                  parent={rel.parent}
                />
              ))}
            </div>
          </section>
        )}

        {/* 서식지 정보 */}
        {hasHabitatInfo && (
          <section className="bg-white px-5 py-5">
            <SectionTitle icon={<TreePine className="w-4 h-4" />} title="서식 환경" />
            <div className="space-y-3.5 mt-4">
              {animal.detail?.cageInfo && (
                <InfoRow label="케이지">{animal.detail.cageInfo}</InfoRow>
              )}
              {animal.detail?.flooringInfo && (
                <InfoRow label="바닥재">{animal.detail.flooringInfo}</InfoRow>
              )}
              {animal.detail?.habitatNotes && (
                <InfoRow label="기타">
                  <p className="whitespace-pre-wrap">{animal.detail.habitatNotes}</p>
                </InfoRow>
              )}
            </div>
          </section>
        )}

      </div>

      {/* 전체 화면 이미지 뷰어 */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setSelectedImageIndex(null)}>
          <div className="flex items-center justify-between px-4 py-3 z-10">
            <span className="text-white/70 text-[15px]">
              {selectedImageIndex + 1} / {sortedImages.length}
            </span>
            <button onClick={() => setSelectedImageIndex(null)} className="text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <img
              src={sortedImages[selectedImageIndex].imageUrl}
              alt={animal.name || '개체 이미지'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {sortedImages.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex(
                      selectedImageIndex === 0 ? sortedImages.length - 1 : selectedImageIndex - 1
                    )
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((selectedImageIndex + 1) % sortedImages.length)
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 유틸 ─── */

function getQualityColor(quality: string) {
  switch (quality) {
    case 'S':
      return 'bg-amber-50 text-amber-600 border-amber-300'
    case 'A':
      return 'bg-emerald-50 text-emerald-600 border-emerald-300'
    case 'B':
      return 'bg-sky-50 text-sky-600 border-sky-300'
    case 'C':
      return 'bg-gray-50 text-gray-500 border-gray-300'
    default:
      return 'bg-gray-50 text-gray-500 border-gray-300'
  }
}

/* ─── 서브 컴포넌트 ─── */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-primary">{icon}</div>
      <h2 className="text-[15px] font-semibold">{title}</h2>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-[14px] text-muted-foreground w-20 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-[15px]">{children}</div>
    </div>
  )
}

function ParentCard({
  label,
  parent,
}: {
  label: string
  parent: {
    id: string
    name: string | null
    uniqueId: string
    gender: string
    images: Array<{ imageUrl: string }>
    codes: Array<{ isPrimary: boolean; code: { id: string; category: string; name: string } }>
  }
}) {
  const imageUrl = parent.images[0]?.imageUrl
  const morphCode = parent.codes.find((c) => c.code.category === 'MORPH' && c.isPrimary)

  return (
    <Link
      href={`/guest/animals/${parent.id}`}
      className="block rounded-xl overflow-hidden bg-gray-50 active:opacity-80 transition-opacity"
    >
      <div className="relative aspect-square bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt={parent.name || '부모 개체'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[13px]">
            없음
          </div>
        )}
        <span className="absolute top-2 left-2 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded-full">
          {label}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[14px] font-medium truncate">{parent.name || parent.uniqueId}</p>
        {morphCode && (
          <p className="text-[13px] text-muted-foreground truncate mt-0.5">{morphCode.code.name}</p>
        )}
      </div>
    </Link>
  )
}
