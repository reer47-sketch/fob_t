'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
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
import { Loader2, Plus, RotateCcw, CheckCircle2, AlertCircle, Download, Upload } from 'lucide-react'
import { TenantSelector } from './_components/tenant-selector'
import { FileDropzone } from './_components/file-dropzone'
import { BulkEditTable, type BulkAnimalRow } from './_components/bulk-edit-table'
import { parseBulkFilename, isImageFile } from '@/lib/parse-bulk-filename'
import { resizeImage } from '@/lib/image-resize'
import { getTenants } from '@/actions/admin/get-tenants'
import { getSpeciesForBulk } from '@/actions/admin/get-codes'
import { bulkCreateAnimals } from '@/actions/admin/bulk-create-animals'
import { exportCodeSheet } from '@/actions/admin/export-code-sheet'

interface Tenant {
  id: string
  name: string
  slug: string | null
  users: Array<{ id: string; email: string | null; name: string | null; role: string; status: string }>
}

interface Species {
  id: string
  code: string
  name: string
}

export default function BulkUploadPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [rows, setRows] = useState<BulkAnimalRow[]>([])
  const [processing, setProcessing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [downloadingCodes, setDownloadingCodes] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDownloadCodeSheet = async () => {
    setDownloadingCodes(true)
    try {
      const res = await exportCodeSheet()
      if (res.success) {
        const blob = new Blob([new Uint8Array(res.data.buffer)], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.data.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error('코드표 다운로드에 실패했습니다')
    } finally {
      setDownloadingCodes(false)
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    async function load() {
      const [tenantResult, species] = await Promise.all([
        getTenants(),
        getSpeciesForBulk(),
      ])
      if (tenantResult.success) {
        setTenants(tenantResult.data as Tenant[])
      }
      setSpeciesList(species)
    }
    load()
  }, [])

  // 파일 처리 공통 로직
  const processFiles = useCallback(
    async (files: File[]) => {
      setProcessing(true)
      setResult(null)
      const newRows: BulkAnimalRow[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!isImageFile(file)) continue

        const resizedFile = await resizeImage(file)
        const parsed = parseBulkFilename(file)

        let speciesId: string | null = null
        if (parsed.speciesCode) {
          const match = speciesList.find(
            (s) => s.code.toUpperCase() === parsed.speciesCode!.toUpperCase()
          )
          if (match) {
            speciesId = match.id
          } else {
            parsed.errors.push(`종 코드 "${parsed.speciesCode}" 매칭 실패`)
          }
        }

        const imagePreview = URL.createObjectURL(resizedFile)

        newRows.push({
          id: crypto.randomUUID(),
          file: resizedFile,
          imagePreview,
          name: parsed.name,
          gender: parsed.gender,
          hatchDate: parsed.hatchDate,
          speciesId,
          speciesCode: parsed.speciesCode,
          primaryMorphId: null,
          morphCode: parsed.morphCode,
          acquisitionType: parsed.acquisitionType,
          errors: parsed.errors,
          warnings: parsed.warnings,
        })

        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      setRows((prev) => [...prev, ...newRows])
      setProcessing(false)
      setProgress(0)
      if (newRows.length > 0) {
        toast.success(`${newRows.length}개 파일 추가됨`)
      }
    },
    [speciesList]
  )

  const handleUpdateRow = useCallback((id: string, updates: Partial<BulkAnimalRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updates } : row))
    )
  }, [])

  const handleDeleteRow = useCallback((id: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id)
      if (row) URL.revokeObjectURL(row.imagePreview)
      return prev.filter((r) => r.id !== id)
    })
  }, [])

  const hasErrors = rows.some(
    (r) => !r.gender || !r.speciesId || !r.primaryMorphId || !r.acquisitionType
  )

  const errorCount = rows.filter((r) => !r.gender || !r.speciesId || !r.primaryMorphId || !r.acquisitionType).length
  const validCount = rows.length - errorCount

  const handleSubmit = async () => {
    setConfirmOpen(false)
    setSubmitting(true)

    try {
      const animals = rows.map((row) => ({
        name: row.name,
        gender: row.gender!,
        hatchDate: row.hatchDate ? row.hatchDate.toISOString() : null,
        speciesId: row.speciesId!,
        primaryMorphId: row.primaryMorphId!,
        acquisitionType: row.acquisitionType!,
      }))

      const imageFiles = rows.map((row) => row.file)
      const res = await bulkCreateAnimals(selectedTenantId, animals, imageFiles)

      if (res.success === true && 'data' in res) {
        setResult(res.data)
        toast.success(`${res.data.created}건 등록 완료`)
        if (res.data.failed > 0) {
          toast.error(`${res.data.failed}건 실패`)
        }
        if (res.data.failed === 0) {
          rows.forEach((r) => URL.revokeObjectURL(r.imagePreview))
          setRows([])
        }
      } else if ('error' in res) {
        toast.error(res.error || '등록 실패')
      }
    } catch (err) {
      toast.error('등록 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClear = () => {
    rows.forEach((r) => URL.revokeObjectURL(r.imagePreview))
    setRows([])
    setResult(null)
  }

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId)

  const canDrop = !!selectedTenantId && !processing && !submitting

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (canDrop) setDragging(true)
  }, [canDrop])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    if (!canDrop) return
    const imageFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      processFiles(imageFiles)
    }
  }, [canDrop, processFiles])

  return (
    <div
      className="relative flex h-[calc(100vh-5rem)] flex-col overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 드래그 오버레이 */}
      {dragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-10 w-10" />
            <p className="text-sm font-medium">파일을 놓아서 추가</p>
          </div>
        </div>
      )}
      {/* 상단 툴바 */}
      <div className="shrink-0 flex items-center gap-3 pb-4">
        <TenantSelector
          tenants={tenants}
          value={selectedTenantId}
          onChange={(v) => { setSelectedTenantId(v); setResult(null) }}
          disabled={submitting}
        />

        {selectedTenantId && (
          <>
            <div className="h-8 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing || submitting}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              파일 추가
            </Button>
            {rows.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={submitting}
                className="text-muted-foreground"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                초기화
              </Button>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">총 {rows.length}건</span>
                {validCount > 0 && (
                  <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {validCount}
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700">
                    <AlertCircle className="h-3 w-3" />
                    {errorCount}
                  </Badge>
                )}
              </div>
              {submitting && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  등록 중...
                </span>
              )}
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={hasErrors || submitting || !selectedTenantId}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasErrors
                  ? `오류 ${errorCount}건 수정 필요`
                  : `${rows.length}건 등록`}
              </Button>
              <div className="h-8 w-px bg-border" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadCodeSheet}
            disabled={downloadingCodes}
            className="text-muted-foreground"
          >
            {downloadingCodes
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <Download className="mr-1.5 h-3.5 w-3.5" />
            }
            코드표 다운로드
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              processFiles(Array.from(e.target.files))
              e.target.value = ''
            }
          }}
        />
      </div>

      {/* 프로그레스 바 (파일 처리 중) */}
      {processing && (
        <div className="shrink-0 pb-3">
          <div className="flex items-center gap-2 pb-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            파일 처리 중... ({progress}%)
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 min-h-0">
        {!selectedTenantId ? (
          /* 파트너사 미선택 상태 */
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">파트너사를 선택하세요</p>
          </div>
        ) : rows.length === 0 && !result ? (
          /* 파일 없음: 드롭존 */
          <FileDropzone
            onFilesSelected={processFiles}
            disabled={processing || submitting}
          />
        ) : result && rows.length === 0 ? (
          /* 등록 완료 결과 */
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-medium">{result.created}건 등록 완료</p>
              {result.failed > 0 && (
                <p className="mt-1 text-sm text-destructive">{result.failed}건 실패</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedTenant?.name}에 개체가 등록되었습니다
              </p>
            </div>
            {result.failed > 0 && result.errors.length > 0 && (
              <div className="max-w-md rounded-md border bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium text-destructive">실패 항목</p>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResult(null)}
            >
              추가 등록
            </Button>
          </div>
        ) : (
          /* 편집 테이블 */
          <div className="flex h-full flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              <BulkEditTable
                rows={rows}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                speciesList={speciesList}
              />
            </div>
          </div>
        )}
      </div>

      {/* 확인 다이얼로그 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 등록</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedTenant?.name}</strong>에 {rows.length}건의 개체를 등록합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>등록</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
