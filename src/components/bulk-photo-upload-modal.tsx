'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { parseClientBulkFilename, isImageFile } from '@/lib/parse-client-bulk-filename'
import type { ParsedClientBulkFile } from '@/lib/parse-client-bulk-filename'
import { getMorphsBySpecies } from '@/actions/codes/get-codes'

interface Species {
  id: string
  code: string
  name: string
}

interface MorphInfo {
  id: string
  code: string
  name: string
}

export interface PhotoUploadResult {
  speciesId: string
  speciesCode: string
  files: ParsedClientBulkFile[]
}

interface BulkPhotoUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  speciesList: Species[]
  onUpload: (result: PhotoUploadResult) => void
}

export function BulkPhotoUploadModal({
  open,
  onOpenChange,
  speciesList,
  onUpload,
}: BulkPhotoUploadModalProps) {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('')
  const [parsedFiles, setParsedFiles] = useState<ParsedClientBulkFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [morphs, setMorphs] = useState<MorphInfo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  // 모달 열릴 때 기본 종 설정 (크레스티드 게코), 닫힐 때 초기화
  useEffect(() => {
    if (open) {
      const cg = speciesList.find((s) => s.code === 'CG')
      if (cg && !selectedSpeciesId) {
        setSelectedSpeciesId(cg.id)
      }
    } else {
      setSelectedSpeciesId('')
      setParsedFiles([])
      setMorphs([])
      setDragging(false)
      dragCounter.current = 0
    }
  }, [open, speciesList]) // eslint-disable-line react-hooks/exhaustive-deps

  // 종 선택 시 모프 목록 로드
  useEffect(() => {
    if (!selectedSpeciesId) {
      setMorphs([])
      return
    }
    getMorphsBySpecies(selectedSpeciesId).then(setMorphs)
  }, [selectedSpeciesId])

  // morphCode → morph 매칭 헬퍼
  const findMorph = useCallback(
    (code: string | null): MorphInfo | null => {
      if (!code) return null
      return morphs.find((m) => m.code.toUpperCase() === code.toUpperCase()) ?? null
    },
    [morphs]
  )

  // 매칭 실패한 파일이 있는지
  const hasUnmatchedMorphs = parsedFiles.some(
    (pf) => pf.morphCode && !findMorph(pf.morphCode)
  )

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const imageFiles = Array.from(fileList).filter(isImageFile)
    if (imageFiles.length === 0) return

    const parsed = imageFiles.map(parseClientBulkFilename)
    setParsedFiles((prev) => [...prev, ...parsed])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleRemoveFile = (index: number) => {
    setParsedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    const species = speciesList.find((s) => s.id === selectedSpeciesId)
    if (!species || parsedFiles.length === 0) return

    onUpload({
      speciesId: species.id,
      speciesCode: species.code,
      files: parsedFiles,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>사진 추가</DialogTitle>
          <DialogDescription>
            종을 선택한 뒤 사진을 드래그하여 추가하세요.
            파일명은 <code className="text-xs bg-muted px-1 py-0.5 rounded">모프코드_해칭일.확장자</code> 형식입니다.
          </DialogDescription>
        </DialogHeader>

        {/* 종 선택 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">종 선택</label>
          <Select value={selectedSpeciesId} onValueChange={setSelectedSpeciesId}>
            <SelectTrigger>
              <SelectValue placeholder="종을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {speciesList.map((species) => (
                <SelectItem key={species.id} value={species.id}>
                  {species.name} ({species.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 드래그앤드롭 영역 */}
        {selectedSpeciesId && (
          <div
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/30'
            }`}
          >
            <Upload className="h-6 w-6 text-muted-foreground/60" />
            <div className="text-center">
              <p className="text-sm font-medium">이미지를 드래그하거나 클릭</p>
              <p className="mt-1 text-xs text-muted-foreground">
                예: HQ_20250301.jpg, NM_1.png
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  processFiles(e.target.files)
                  e.target.value = ''
                }
              }}
            />
          </div>
        )}

        {/* 파일 목록 */}
        {parsedFiles.length > 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {parsedFiles.map((pf, index) => {
              const matchedMorph = findMorph(pf.morphCode)
              const isMorphUnmatched = !!pf.morphCode && !matchedMorph

              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    isMorphUnmatched ? 'border-red-300 bg-red-50/50' : ''
                  }`}
                >
                  <ImageIcon className={`h-4 w-4 shrink-0 ${isMorphUnmatched ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <span className="flex-1 min-w-0 truncate">{pf.file.name}</span>
                  {pf.morphCode && (
                    isMorphUnmatched ? (
                      <span className="shrink-0 flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-destructive font-medium max-w-24">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span className="truncate">{pf.morphCode}</span>
                      </span>
                    ) : (
                      <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
                        {matchedMorph!.name}
                      </span>
                    )
                  )}
                  {pf.hatchDate && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {pf.hatchDate.toLocaleDateString('ko-KR')}
                    </span>
                  )}
                  {pf.errors.length > 0 && (
                    <span className="shrink-0 text-xs text-destructive">
                      {pf.errors[0]}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile(index)
                    }}
                    className="shrink-0 rounded p-0.5 hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* 오류 안내 */}
        {hasUnmatchedMorphs && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            존재하지 않는 모프 코드가 포함되어 있습니다. 해당 파일을 제거하거나 파일명을 수정해주세요.
          </p>
        )}

        {/* 액션 */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSpeciesId || parsedFiles.length === 0 || hasUnmatchedMorphs}
          >
            {parsedFiles.length}장 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
