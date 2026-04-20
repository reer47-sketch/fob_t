'use client'

import { useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function FileDropzone({ onFilesSelected, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles)
      }
    },
    [onFilesSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => !disabled && inputRef.current?.click()}
      className="flex h-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/40 hover:bg-muted/30"
    >
      <div className="rounded-full bg-muted p-4">
        <Upload className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="text-center">
        <p className="font-medium">이미지 파일을 드래그하거나 클릭하여 선택</p>
        <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          <p>파일명 규칙: 이름_성별(M/F/U)_해칭일(YYYYMMDD)_종코드_모프코드_등록유형(A/H).jpg</p>
          <p>예시: 또리_M_20250315_CG_HQ_A.jpg (입양) / 또리_F_20250315_CG_HQ_H.jpg (해칭)</p>
          <p>빈 필드는 비워둡니다: _F__CG_LW_H.jpg</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files)
            e.target.value = ''
          }
        }}
      />
    </div>
  )
}
