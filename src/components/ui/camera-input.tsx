'use client'

import { useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { resizeImage } from '@/lib/image-resize'

interface CameraInputProps {
  onCapture: (file: File) => void
  onRemove?: () => void
  preview?: string | null
}

export interface CameraInputHandle {
  openCamera: () => void
}

export const CameraInput = forwardRef<CameraInputHandle, CameraInputProps>(
  ({ onCapture, onRemove, preview }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraFileInputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // 부모 컴포넌트에서 카메라를 열 수 있도록 ref 노출
    useImperativeHandle(ref, () => ({
      openCamera: () => {
        cameraFileInputRef.current?.click()
      },
    }))

    const processFile = useCallback(async (file: File) => {
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다')
        return
      }

      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다')
        return
      }

      setError(null)

      // 이미지 리사이징 (최대 1600px, 85% 품질)
      try {
        const resizedFile = await resizeImage(file)
        onCapture(resizedFile)
      } catch (err) {
        console.error('Image resize error:', err)
        // 리사이징 실패 시 원본 사용
        onCapture(file)
      }
    }, [onCapture])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await processFile(file)
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (!file) return
      await processFile(file)
    }, [processFile])

    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {preview ? (
          <div className="relative flex-1 flex items-center justify-center min-h-0">
            <img
              src={preview}
              alt="촬영된 사진"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            className={`group w-full flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary hover:bg-primary/5 bg-gray-50/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-primary/10' : 'bg-emerald-100 group-hover:bg-primary/10'
            }`}>
              <ImagePlus className={`w-6 h-6 transition-colors ${isDragging ? 'text-primary' : 'text-emerald-600 group-hover:text-primary'}`} />
            </div>
            <div className="text-center space-y-1">
              <p className={`text-base font-medium transition-colors ${isDragging ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}`}>
                {isDragging ? '여기에 놓으세요' : '사진을 촬영하거나 업로드하세요'}
              </p>
              <p className="text-sm text-gray-400 transition-colors group-hover:text-primary/60">
                클릭 또는 드래그 앤 드롭
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
      </div>
    )
  }
)
