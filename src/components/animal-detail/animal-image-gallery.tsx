'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Upload, X, ZoomIn, Loader2, RefreshCw } from 'lucide-react'
import { uploadAnimalImage } from '@/actions/animals/upload-animal-image'
import { deleteAnimalImage } from '@/actions/animals/delete-animal-image'
import { replaceAnimalImage } from '@/actions/animals/replace-animal-image'
import { toast } from 'sonner'
import { resizeImage } from '@/lib/image-resize'

interface AnimalImage {
  id: string
  imageUrl: string
  displayOrder: number
  description: string | null
  createdAt: Date
}

interface AnimalImageGalleryProps {
  images: AnimalImage[]
  animalName: string | null
  animalId: string
  onUpdate?: () => void
}

export function AnimalImageGallery({ images, animalName, animalId, onUpdate }: AnimalImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)

  const handlePreviousImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      )
    }
  }

  const handleNextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleReplaceClick = () => {
    replaceFileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setIsUploading(true)
    try {
      // 이미지 리사이징 (최대 1600px, 85% 품질)
      const resizedFile = await resizeImage(file)
      const result = await uploadAnimalImage(animalId, resizedFile)

      if (result.success) {
        toast.success('이미지가 업로드되었습니다.')
        onUpdate?.()
      } else {
        toast.error(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentImage) return

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setIsReplacing(true)
    try {
      const resizedFile = await resizeImage(file)
      const result = await replaceAnimalImage(currentImage.id, resizedFile)

      if (result.success) {
        toast.success('이미지가 변경되었습니다.')
        onUpdate?.()
      } else {
        toast.error(result.error || '이미지 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Replace error:', error)
      toast.error('이미지 변경 중 오류가 발생했습니다.')
    } finally {
      setIsReplacing(false)
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async () => {
    const currentImage = images[currentImageIndex]
    if (!currentImage) return

    // 기본 이미지는 삭제 불가
    if (currentImage.displayOrder === 0) {
      toast.error('기본 이미지는 삭제할 수 없습니다.')
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAnimalImage(currentImage.id)

      if (result.success) {
        toast.success('이미지가 삭제되었습니다.')

        // 현재 인덱스 조정
        if (currentImageIndex >= images.length - 1) {
          setCurrentImageIndex(Math.max(0, images.length - 2))
        }

        onUpdate?.()
      } else {
        toast.error(result.error || '이미지 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('이미지 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const currentImage = images[currentImageIndex]
  const isFirstImage = currentImage && currentImage.displayOrder === 0
  const canDelete = currentImage && !isFirstImage
  const canReplace = currentImage && isFirstImage

  return (
    <>
      <div>
        <h3 className="text-sm font-semibold mb-2">사진</h3>
        <div className="space-y-2">
          {/* 사진 표시 영역 */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {currentImage ? (
              <>
                <img
                  src={currentImage.imageUrl}
                  alt={animalName || '개체 이미지'}
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  style={{ imageRendering: 'auto' as any }}
                  loading="eager"
                  onClick={() => setImageDialogOpen(true)}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => setImageDialogOpen(true)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                사진 없음
              </div>
            )}
          </div>

          {/* 사진 네비게이션 */}
          {images.length > 1 && (
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreviousImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentImageIndex + 1} / {images.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* 사진 업로드/변경/삭제 버튼 */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={replaceFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReplaceFileChange}
            />
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleUploadClick}
              disabled={images.length >= 4 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  업로드 ({images.length}/4)
                </>
              )}
            </Button>
            {currentImage && canReplace && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReplaceClick}
                disabled={isReplacing}
              >
                {isReplacing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {currentImage && canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteImage}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 이미지 확대 다이얼로그 */}
      {imageDialogOpen && currentImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setImageDialogOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={currentImage.imageUrl}
              alt={animalName || '개체 이미지'}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={() => setImageDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
