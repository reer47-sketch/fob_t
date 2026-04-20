'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAnimalDetail } from '@/actions/animals/get-animal-detail'
import { deleteAnimal } from '@/actions/animals/delete-animal'
import type { AnimalDetailData } from '@/services/animal-service'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronLeft, ChevronRight, X, Upload, Loader2, RefreshCw, ZoomIn } from 'lucide-react'
import QRCode from 'qrcode'
import { AnimalSidebar } from '@/components/animal-detail/animal-sidebar'
import { AnimalInfoContent } from '@/components/animal-detail/animal-info-content'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import { uploadAnimalImage } from '@/actions/animals/upload-animal-image'
import { deleteAnimalImage } from '@/actions/animals/delete-animal-image'
import { replaceAnimalImage } from '@/actions/animals/replace-animal-image'
import { resizeImage } from '@/lib/image-resize'

interface AnimalDetailSheetProps {
  animalId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
  onUpdated?: () => void
}

export function AnimalDetailSheet({
  animalId,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: AnimalDetailSheetProps) {
  const [animal, setAnimal] = useState<AnimalDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [qrLinkUrl, setQrLinkUrl] = useState<string>('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMobile = useIsMobile()

  const fetchAnimalDetail = useCallback(async () => {
    if (!animalId) return

    setLoading(true)
    try {
      const result = await getAnimalDetail(animalId)
      if (result.success && 'data' in result) {
        setAnimal(result.data)

        // Generate QR code
        if (result.data.qrCodeUrl) {
          const fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${result.data.qrCodeUrl}`
          const qrUrl = await QRCode.toDataURL(fullUrl)
          setQrCodeDataUrl(qrUrl)
          setQrLinkUrl(fullUrl)
        }
      } else {
        console.error('Failed to fetch animal detail:', result.error)
        setAnimal(null)
      }
    } catch (error) {
      console.error('Error fetching animal detail:', error)
      setAnimal(null)
    } finally {
      setLoading(false)
    }
  }, [animalId])

  useEffect(() => {
    if (!animalId || !open) {
      return
    }

    fetchAnimalDetail()
  }, [animalId, open, fetchAnimalDetail])

  const handleDelete = async () => {
    if (!animalId) return

    setIsDeleting(true)
    try {
      const result = await deleteAnimal(animalId)

      if (result.success) {
        toast.success('개체가 삭제되었습니다', {
          description: '개체가 성공적으로 삭제되었습니다.',
        })
        setIsDeleteDialogOpen(false)
        onOpenChange(false)
        onDeleted?.()
      } else {
        toast.error('삭제 실패', {
          description: result.error || '개체 삭제 중 오류가 발생했습니다.',
        })
      }
    } catch (error) {
      console.error('Error deleting animal:', error)
      toast.error('삭제 실패', {
        description: '개체 삭제 중 오류가 발생했습니다.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent
            className="h-[95dvh] rounded-t-2xl p-0 flex flex-col gap-0"
          >
            {/* 헤더 */}
            <div className="shrink-0">
              <DrawerHeader className="px-4 py-2 border-b flex-row items-center justify-between">
                <DrawerTitle className="text-[15px]">개체 상세</DrawerTitle>
              </DrawerHeader>
            </div>

            {/* 스크롤 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-[15px] text-muted-foreground">불러오는 중...</p>
                  </div>
                </div>
              ) : !animal ? (
                <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                  <p className="text-muted-foreground">개체를 찾을 수 없습니다.</p>
                </div>
              ) : (
                <MobileAnimalContent
                  animal={animal}
                  qrCodeDataUrl={qrCodeDataUrl}
                  qrLinkUrl={qrLinkUrl}
                  onUpdate={fetchAnimalDetail}
                  onUpdateWithRefresh={() => {
                    fetchAnimalDetail()
                    onUpdated?.()
                  }}
                  onDeleteRequest={() => setIsDeleteDialogOpen(true)}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>개체를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  이 작업은 되돌릴 수 없습니다. 개체가 삭제되면 복구할 수 없습니다.
                  {animal && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <div className="text-sm font-medium text-foreground">
                        {animal.name || '이름 없음'} ({animal.uniqueId})
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // ── 데스크톱 레이아웃 (기존 유지) ──
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>개체 상세 정보</SheetTitle>
          </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : !animal ? (
              <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <p className="text-muted-foreground">개체를 찾을 수 없습니다.</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex gap-6">
                  {/* 좌측 영역: 사진 & QR 코드 */}
                  <div className="shrink-0 flex flex-col justify-between">
                    <AnimalSidebar
                      images={animal.images}
                      animalName={animal.name}
                      animalId={animal.id}
                      qrCodeDataUrl={qrCodeDataUrl}
                      qrLinkUrl={qrLinkUrl}
                      owner={animal.owner}
                      onUpdate={fetchAnimalDetail}
                    />
                    {/* 하단 삭제 버튼 */}
                    {animal && (
                      <div className="py-4 border-t shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDeleteDialogOpen(true)}
                          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                          개체 삭제
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 우측 영역: 정보 */}
                  <div className="flex-1 min-w-0">
                    <AnimalInfoContent
                      animal={animal}
                      qrLinkUrl={qrLinkUrl}
                      onUpdate={fetchAnimalDetail}
                      onUpdateWithRefresh={() => {
                        fetchAnimalDetail()
                        onUpdated?.()
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </SheetContent>
    </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>개체를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                이 작업은 되돌릴 수 없습니다. 개체가 삭제되면 복구할 수 없습니다.
                {animal && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="text-sm font-medium text-foreground">
                      {animal.name || '이름 없음'} ({animal.uniqueId})
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* ═══════════════════════════════════════════
   모바일 전용 콘텐츠 컴포넌트
   ═══════════════════════════════════════════ */

function MobileAnimalContent({
  animal,
  qrCodeDataUrl,
  qrLinkUrl,
  onUpdate,
  onUpdateWithRefresh,
  onDeleteRequest,
}: {
  animal: AnimalDetailData
  qrCodeDataUrl: string
  qrLinkUrl: string
  onUpdate: () => void
  onUpdateWithRefresh: () => void
  onDeleteRequest: () => void
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeletingImage, setIsDeletingImage] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)

  const sortedImages = [...animal.images].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const speciesCode = animal.codes.find((c) => c.code.category === 'SPECIES')
  const morphCodes = animal.codes.filter((c) => c.code.category === 'MORPH')

  const genderLabel =
    animal.gender === 'MALE' ? '♂ 수컷' : animal.gender === 'FEMALE' ? '♀ 암컷' : '미구분'

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const index = Math.round(container.scrollLeft / container.offsetWidth)
    setCurrentImageIndex(index)
  }

  const currentImage = sortedImages[currentImageIndex]
  const isFirstImage = currentImage && currentImage.displayOrder === 0

  const handleUploadClick = () => fileInputRef.current?.click()
  const handleReplaceClick = () => replaceFileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 업로드할 수 있습니다.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('파일 크기는 10MB 이하여야 합니다.'); return }

    setIsUploading(true)
    try {
      const resizedFile = await resizeImage(file)
      const result = await uploadAnimalImage(animal.id, resizedFile)
      if (result.success) { toast.success('이미지가 업로드되었습니다.'); onUpdate() }
      else { toast.error(result.error || '이미지 업로드에 실패했습니다.') }
    } catch { toast.error('이미지 업로드 중 오류가 발생했습니다.') }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentImage) return
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 업로드할 수 있습니다.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('파일 크기는 10MB 이하여야 합니다.'); return }

    setIsReplacing(true)
    try {
      const resizedFile = await resizeImage(file)
      const result = await replaceAnimalImage(currentImage.id, resizedFile)
      if (result.success) { toast.success('이미지가 변경되었습니다.'); onUpdate() }
      else { toast.error(result.error || '이미지 변경에 실패했습니다.') }
    } catch { toast.error('이미지 변경 중 오류가 발생했습니다.') }
    finally { setIsReplacing(false); if (replaceFileInputRef.current) replaceFileInputRef.current.value = '' }
  }

  const handleDeleteImage = async () => {
    if (!currentImage) return
    if (currentImage.displayOrder === 0) { toast.error('기본 이미지는 삭제할 수 없습니다.'); return }

    setIsDeletingImage(true)
    try {
      const result = await deleteAnimalImage(currentImage.id)
      if (result.success) {
        toast.success('이미지가 삭제되었습니다.')
        if (currentImageIndex >= sortedImages.length - 1) {
          setCurrentImageIndex(Math.max(0, sortedImages.length - 2))
        }
        onUpdate()
      } else { toast.error(result.error || '이미지 삭제에 실패했습니다.') }
    } catch { toast.error('이미지 삭제 중 오류가 발생했습니다.') }
    finally { setIsDeletingImage(false) }
  }

  return (
    <div className="bg-gray-50">
      {/* 이미지 캐러셀 */}
      <div className="bg-white">
        {sortedImages.length > 0 ? (
          <>
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
          </>
        ) : (
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-muted-foreground text-[14px]">
            사진 없음
          </div>
        )}

        {/* 이미지 업로드/변경/삭제 버튼 */}
        <div className="flex gap-2 px-4 pb-3">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <input ref={replaceFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceFileChange} />
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-[13px]"
            onClick={handleUploadClick}
            disabled={sortedImages.length >= 4 || isUploading}
          >
            {isUploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />업로드 중...</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1" />업로드 ({sortedImages.length}/4)</>
            )}
          </Button>
          {currentImage && isFirstImage && (
            <Button size="sm" variant="outline" className="h-8" onClick={handleReplaceClick} disabled={isReplacing}>
              {isReplacing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          )}
          {currentImage && !isFirstImage && (
            <Button size="sm" variant="outline" className="h-8" onClick={handleDeleteImage} disabled={isDeletingImage}>
              {isDeletingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* 핵심 정보 */}
      <div className="bg-white px-5 pt-5 pb-5 mt-2">
        {speciesCode && (
          <p className="text-[14px] text-muted-foreground mb-1">
            {speciesCode.code.name}
          </p>
        )}
        <h2 className="text-[20px] font-bold leading-tight">
          {animal.name || animal.uniqueId}
        </h2>
        {animal.name && (
          <p className="text-[13px] text-muted-foreground mt-1">ID: {animal.uniqueId}</p>
        )}

        {/* 모프 + 등급 뱃지 */}
        {(morphCodes.length > 0 || animal.detail?.quality) && (
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
        )}

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

      {/* 편집 가능한 정보 섹션 */}
      <div className="mt-2 bg-white">
        <div className="px-5 py-4">
          <AnimalInfoContent
            animal={animal}
            qrLinkUrl={qrLinkUrl}
            onUpdate={onUpdate}
            onUpdateWithRefresh={onUpdateWithRefresh}
          />
        </div>
      </div>

      {/* QR 코드 */}
      {qrCodeDataUrl && (
        <div className="mt-2 bg-white px-5 py-5">
          <h3 className="text-[15px] font-semibold mb-3">QR 코드</h3>
          <img src={qrCodeDataUrl} alt="QR Code" className="w-20 h-20 rounded-lg" />
        </div>
      )}

      {/* 소유자 정보 */}
      {animal.owner && (
        <div className="mt-2 bg-white px-5 py-5">
          <h3 className="text-[15px] font-semibold mb-3">소유자 정보</h3>
          <div className="space-y-1.5 text-[14px]">
            <div className="flex gap-3">
              <span className="text-muted-foreground w-16 shrink-0">이름</span>
              <span>{animal.owner.name}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground w-16 shrink-0">연락처</span>
              <span>{animal.owner.phone}</span>
            </div>
            {animal.owner.address && (
              <div className="flex gap-3">
                <span className="text-muted-foreground w-16 shrink-0">주소</span>
                <span>{animal.owner.address}</span>
              </div>
            )}
            <div className="flex gap-3">
              <span className="text-muted-foreground w-16 shrink-0">분양일</span>
              <span>{new Date(animal.owner.adoptionDate).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 버튼 */}
      <div className="mt-2 bg-white px-5 py-5">
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteRequest}
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          개체 삭제
        </Button>
      </div>

      {/* 하단 여백 */}
      <div className="h-6" />

      {/* 전체 화면 이미지 뷰어 */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col" onClick={() => setSelectedImageIndex(null)}>
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
