'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { AcquisitionType, Gender } from '@prisma/client'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Loader2,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CalendarIcon,
  Trash2,
  Download,
} from 'lucide-react'
import { BulkPhotoUploadModal, type PhotoUploadResult } from '@/components/bulk-photo-upload-modal'
import { getSpeciesList, getMorphsBySpecies } from '@/actions/codes/get-codes'
import { bulkCreateAnimals } from '@/actions/animals/bulk-create-animals'
import { exportCodeSheet } from '@/actions/admin/export-code-sheet'
import { resizeImage } from '@/lib/image-resize'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Species {
  id: string
  code: string
  name: string
}

interface Morph {
  id: string
  code: string
  name: string
}

interface BulkAnimalRow {
  id: string
  file: File
  imagePreview: string
  name: string | null
  gender: Gender | null
  hatchDate: Date | null
  speciesId: string
  speciesCode: string
  primaryMorphId: string | null
  morphCode: string | null
  acquisitionType: AcquisitionType | null
  errors: string[]
  warnings: string[]
}

const GENDER_OPTIONS = [
  { value: Gender.MALE, label: '수컷 (M)' },
  { value: Gender.FEMALE, label: '암컷 (F)' },
  { value: Gender.UNKNOWN, label: '미확인 (U)' },
]

const ACQUISITION_TYPE_OPTIONS = [
  { value: AcquisitionType.ADOPTION, label: '입양' },
  { value: AcquisitionType.HATCHING, label: '해칭' },
]

export function BulkUploadClient() {
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [rows, setRows] = useState<BulkAnimalRow[]>([])
  const [morphCache, setMorphCache] = useState<Record<string, Morph[]>>({})
  const morphCacheRef = useRef(morphCache)
  morphCacheRef.current = morphCache

  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)
  const [downloadingCodes, setDownloadingCodes] = useState(false)

  useEffect(() => {
    getSpeciesList().then(setSpeciesList)
  }, [])

  // 모프 로드
  const loadMorphs = useCallback(async (speciesId: string) => {
    if (morphCacheRef.current[speciesId]) return
    const morphs = await getMorphsBySpecies(speciesId)
    setMorphCache((prev) => ({ ...prev, [speciesId]: morphs }))
  }, [])

  // morphCode → primaryMorphId 자동매칭
  useEffect(() => {
    rows.forEach((row) => {
      if (row.speciesId && row.morphCode && !row.primaryMorphId) {
        const morphs = morphCache[row.speciesId]
        if (morphs) {
          const match = morphs.find(
            (m) => m.code.toUpperCase() === row.morphCode!.toUpperCase()
          )
          if (match) {
            handleUpdateRow(row.id, { primaryMorphId: match.id })
          }
        }
      }
    })
  }, [morphCache, rows.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateRow = useCallback((id: string, updates: Partial<BulkAnimalRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)))
  }, [])

  const handleDeleteRow = useCallback((id: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id)
      if (row) URL.revokeObjectURL(row.imagePreview)
      return prev.filter((r) => r.id !== id)
    })
  }, [])

  // 사진 모달에서 결과 받기
  const handlePhotoUpload = useCallback(
    async (uploadResult: PhotoUploadResult) => {
      setProcessing(true)
      setResult(null)

      // 모프 캐시 로드
      await loadMorphs(uploadResult.speciesId)

      const newRows: BulkAnimalRow[] = []

      for (let i = 0; i < uploadResult.files.length; i++) {
        const pf = uploadResult.files[i]
        const resizedFile = await resizeImage(pf.file)
        const imagePreview = URL.createObjectURL(resizedFile)

        newRows.push({
          id: crypto.randomUUID(),
          file: resizedFile,
          imagePreview,
          name: null,
          gender: null,
          hatchDate: pf.hatchDate,
          speciesId: uploadResult.speciesId,
          speciesCode: uploadResult.speciesCode,
          primaryMorphId: null, // useEffect에서 자동 매칭
          morphCode: pf.morphCode,
          acquisitionType: null,
          errors: pf.errors,
          warnings: pf.warnings,
        })

        setProgress(Math.round(((i + 1) / uploadResult.files.length) * 100))
      }

      setRows((prev) => [...prev, ...newRows])
      setProcessing(false)
      setProgress(0)
      if (newRows.length > 0) {
        toast.success(`${newRows.length}개 파일 추가됨`)
      }
    },
    [loadMorphs]
  )

  const handleMorphChange = (rowId: string, morphId: string, speciesId: string) => {
    const morphs = morphCache[speciesId] || []
    const morph = morphs.find((m) => m.id === morphId)
    handleUpdateRow(rowId, { primaryMorphId: morphId, morphCode: morph?.code || null })
  }

  const getRowStatus = (row: BulkAnimalRow) => {
    const errors: string[] = []
    if (!row.gender) errors.push('성별 필수')
    if (!row.primaryMorphId) errors.push('모프 필수')
    if (!row.acquisitionType) errors.push('등록유형 필수')
    if (errors.length > 0) return 'error'
    if (row.warnings.length > 0 || !row.name) return 'warning'
    return 'valid'
  }

  const hasErrors = rows.some(
    (r) => !r.gender || !r.primaryMorphId || !r.acquisitionType
  )
  const errorCount = rows.filter(
    (r) => !r.gender || !r.primaryMorphId || !r.acquisitionType
  ).length
  const validCount = rows.length - errorCount

  const handleSubmit = async () => {
    setConfirmOpen(false)
    setSubmitting(true)

    try {
      const animals = rows.map((row) => ({
        name: row.name,
        gender: row.gender!,
        hatchDate: row.hatchDate ? row.hatchDate.toISOString() : null,
        speciesId: row.speciesId,
        primaryMorphId: row.primaryMorphId!,
        acquisitionType: row.acquisitionType!,
      }))

      const imageFiles = rows.map((row) => row.file)
      const res = await bulkCreateAnimals(animals, imageFiles)

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

  return (
    <div className="relative flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
      {/* 상단 툴바 */}
      <div className="shrink-0 flex items-center gap-3 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPhotoModalOpen(true)}
          disabled={processing || submitting}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          사진 추가
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
                disabled={hasErrors || submitting}
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
            코드표
          </Button>
        </div>
      </div>

      {/* 프로그레스 */}
      {processing && (
        <div className="shrink-0 pb-3">
          <div className="flex items-center gap-2 pb-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            파일 처리 중... ({progress}%)
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* 메인 */}
      <div className="flex-1 min-h-0">
        {rows.length === 0 && !result ? (
          <div
            onClick={() => setPhotoModalOpen(true)}
            className="flex h-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/40 hover:bg-muted/30"
          >
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <div className="text-center">
              <p className="font-medium">사진을 추가하여 일괄 등록을 시작하세요</p>
              <p className="mt-1 text-xs text-muted-foreground">
                파일명 형식: 모프코드_해칭일(YYYYMMDD).jpg — 해칭일은 선택 사항입니다
              </p>
            </div>
          </div>
        ) : result && rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-medium">{result.created}건 등록 완료</p>
              {result.failed > 0 && (
                <p className="mt-1 text-sm text-destructive">{result.failed}건 실패</p>
              )}
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
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              추가 등록
            </Button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">사진</TableHead>
                      <TableHead className="w-[50px]">상태</TableHead>
                      <TableHead className="w-[140px]">이름</TableHead>
                      <TableHead className="w-[120px]">성별</TableHead>
                      <TableHead className="w-[160px]">해칭일</TableHead>
                      <TableHead className="w-[120px]">종</TableHead>
                      <TableHead className="w-[160px]">모프</TableHead>
                      <TableHead className="w-[120px]">등록유형</TableHead>
                      <TableHead className="w-[60px]">삭제</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const status = getRowStatus(row)
                      const morphs = morphCache[row.speciesId] || []

                      return (
                        <TableRow
                          key={row.id}
                          className={
                            status === 'error'
                              ? 'bg-red-50/50'
                              : status === 'warning'
                                ? 'bg-yellow-50/30'
                                : ''
                          }
                        >
                          <TableCell>
                            <img
                              src={row.imagePreview}
                              alt=""
                              className="h-16 w-16 rounded object-cover"
                            />
                          </TableCell>
                          <TableCell>
                            {status === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            {status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.name || ''}
                              onChange={(e) => handleUpdateRow(row.id, { name: e.target.value || null })}
                              placeholder="(없음)"
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.gender || ''}
                              onValueChange={(v) => handleUpdateRow(row.id, { gender: v as Gender })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {GENDER_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-full justify-start text-left text-sm font-normal"
                                >
                                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                                  {row.hatchDate ? format(row.hatchDate, 'yyyy-MM-dd') : '(없음)'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={row.hatchDate || undefined}
                                  onSelect={(date) => handleUpdateRow(row.id, { hatchDate: date || null })}
                                  locale={ko}
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {row.speciesCode}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.primaryMorphId || ''}
                              onValueChange={(v) => handleMorphChange(row.id, v, row.speciesId)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="모프 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {morphs.map((morph) => (
                                  <SelectItem key={morph.id} value={morph.id}>
                                    [{morph.code}] {morph.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.acquisitionType || ''}
                              onValueChange={(v) => handleUpdateRow(row.id, { acquisitionType: v as AcquisitionType })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {ACQUISITION_TYPE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteRow(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 확인 다이얼로그 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 ���록</AlertDialogTitle>
            <AlertDialogDescription>
              {rows.length}건의 개체를 등록합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>등록</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 사진 추가 모달 */}
      <BulkPhotoUploadModal
        open={photoModalOpen}
        onOpenChange={setPhotoModalOpen}
        speciesList={speciesList}
        onUpload={handlePhotoUpload}
      />
    </div>
  )
}
