'use client'

import { forwardRef } from 'react'
import { CameraInput, CameraInputHandle } from '@/components/ui/camera-input'

interface Step1PhotoCaptureProps {
  imagePreview: string | null
  onCapture: (file: File) => void
  onRemove?: () => void
}

export const Step1PhotoCapture = forwardRef<CameraInputHandle, Step1PhotoCaptureProps>(
  ({ imagePreview, onCapture, onRemove }, ref) => {
    return (
      <div className="flex-1 flex flex-col">
        <CameraInput ref={ref} onCapture={onCapture} onRemove={onRemove} preview={imagePreview} />
      </div>
    )
  }
)
